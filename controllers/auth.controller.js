const bcrypt = require('bcrypt')
const userModel = require('../models/user.model')
const { sendVerification, sendOtpEmail } = require('../helpers/nodemailer')
const { signReset, verifyReset } = require('../utils/jwt')
const otpModel = require('../models/otp.model')

class AuthController {
	renderLogin(req, res) {
		res.render('auth/login', { title: 'Login' })
	}

	async login(req, res) {
		try {
			const { email, password } = req.body

			const user = await userModel.findOne({ email })
			if (!user) {
				req.session.alert = { type: 'danger', message: 'User not found.' }
				return res.redirect('/auth/login')
			}

			if (!user.isVerified) {
				req.session.alert = {
					type: 'danger',
					message: 'Please verify your email before logging in.',
				}
				return res.redirect('/auth/login')
			}

			const isMatch = await bcrypt.compare(password, user.password)
			if (!isMatch) {
				req.session.alert = 'Invalid password. Please double check.'
				return res.redirect('/auth/login')
			}

			req.session.user = user
			req.session.alert = {
				type: 'success',
				message: 'Logged in successfully.',
			}
			res.redirect('/')
		} catch (error) {
			console.log(error)
		}
	}

	renderRegister(req, res) {
		res.render('auth/register', { title: 'Register' })
	}

	async register(req, res) {
		try {
			const { email, password, name } = req.body

			const exist = await userModel.findOne({ email })
			if (exist) {
				req.session.alert = {
					type: 'danger',
					message: 'Email is already exist.',
				}
				res.redirect('/auth/login')
			}

			const hashedPassword = await bcrypt.hash(password, 10)

			const createdUser = await userModel.create({
				name,
				email: email.trim().toLowerCase(),
				password: hashedPassword,
			})

			const verifyToken = signReset({ userId: createdUser._id })

			const verifyLink = `${process.env.DOMAIN}/auth/verify/${verifyToken}`
			await sendVerification(email, name, verifyLink)

			req.session.alert = {
				type: 'success',
				message:
					'Registration successful. Please check your email to verify your account.',
			}
			res.redirect('/auth/login')
		} catch (error) {
			console.log(error)
		}
	}

	async verify(req, res) {
		const decoded = verifyReset(req.params.verifyToken)
		if (!decoded) {
			return res.render('auth/verify', {
				success: false,
				message: 'Invalid or expired verification token.',
			})
		}

		const user = await userModel.findById(decoded.userId)
		if (!user) {
			return res.render('auth/verify', {
				success: false,
				message: 'Invalid or expired verification token.',
			})
		}

		user.verifyToken = true
		await user.save()
		return res.render('auth/verify', {
			success: true,
			message:
				'Your account has been successfully verified. You can log in now.',
		})
	}

	logout(req, res) {
		try {
			req.session.destroy(() => {
				res.redirect('/auth/login')
			})
		} catch (error) {
			console.log(error)
		}
	}

	loggedOut(req, res) {
		try {
			req.session.alert = {
				type: 'success',
				message: 'Logged out successfully.',
			}
			res.redirect('/auth/login')
		} catch (error) {
			console.log(error)
		}
	}

	renderForgotPassword(req, res) {
		res.render('auth/forgot-password', { title: 'Forgot Password' })
	}

	async sendOtp(req, res) {
		try {
			const email = req.body.email.trim().toLowerCase()
			if (!email) {
				req.session.alert = { type: 'danger', message: 'Email is required.' }
				return res.redirect('/auth/forgot-password')
			}

			const user = await userModel.findOne({ email })
			if (!user) {
				req.session.alert = { type: 'danger', message: 'User not found.' }
				return res.redirect('/auth/forgot-password')
			}

			const existingOtp = await otpModel
				.findOne({ user: user._id })
				.sort({ createdAt: -1 })
			if (
				existingOtp.otpLastSent &&
				Date.now() - existingOtp.otpLastSent.getTime() < 1 * 60 * 1000
			) {
				req.session.alert = {
					type: 'warning',
					message:
						'An OTP was already sent recently. Please wait 1 minute before requesting a new one.',
				}
				return res.redirect('/auth/forgot-password')
			}

			const otp = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
			const hashedOtp = await bcrypt.hash(otp, 10)

			const otpData = {
				user: user._id,
				otpHash: hashedOtp,
				otpTires: 0,
				otpLastSent: new Date(),
				otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
			}

			await otpModel.create(otpData)
			await sendOtpEmail(email, user.name, otp)

			req.session.alert = {
				type: 'success',
				message: 'OTP has been sent to your email. Please check your inbox.',
			}
			req.session.uid = user._id
			res.redirect(`/auth/verify-otp`)
		} catch (error) {
			console.log(error)
		}
	}

	renderVerifyOtp(req, res) {
		const userId = req.session.uid
		if (!userId) {
			req.session.alert = {
				type: 'danger',
				message: 'Session expired. Please try again.',
			}
			return res.redirect('/auth/forgot-password')
		}
		res.render(`auth/verify-otp`, { title: 'Verify OTP' })
	}

	async verifyOtp(req, res) {
		const userId = req.session.uid
		if (!userId) {
			req.session.alert = {
				type: 'danger',
				message: 'Session expired. Please try again.',
			}
			return res.redirect('/auth/forgot-password')
		}

		const otp = req.body.otp.trim()
		if (!otp) {
			req.session.message = { type: 'danger', message: 'OTP is required.' }
			return res.redirect('/auth/verify-otp')
		}

		const user = await userModel.findById(userId)
		if (!user) {
			req.session.alert = { type: 'danger', message: 'User not found.' }
			return res.redirect('/auth/forgot-password')
		}

		const otpData = await otpModel
			.findOne({ user: userId })
			.sort({ createdAt: -1 })
		if (!otpData) {
			req.session.alert = {
				type: 'danger',
				message: 'No OTP found for this user.',
			}
			return res.redirect('/auth/forgot-password')
		}

		if (otpData.otpExpiresAt < new Date()) {
			await otpModel.deleteMany({ user: userId })
			req.session.alert = {
				type: 'danger',
				message: 'OTP has expired. Please request a new one.',
			}
			return res.redirect('/auth/forgot-password')
		}

		const isMatch = await bcrypt.compare(otp, otpData.otpHash)
		if (!isMatch) {
			otpData.otpTires += 1
			await otpData.save()

			if (otpData.otpTires >= 3) {
				await otpModel.deleteMany({ user: userId })
				req.session.alert = {
					type: 'danger',
					message: 'Too many attempts. Please request a new OTP.',
				}
				return res.redirect('/auth/forgot-password')
			}

			req.session.alert = {
				type: 'danger',
				message: 'Invalid OTP. Please try again.',
			}
			return res.redirect('/auth/verify-otp')
		}

		await otpModel.deleteMany({ user: userId })
		req.session.alert = {
			type: 'success',
			message: 'OTP verified successfully. You can now reset your password.',
		}
		res.redirect(`/auth/reset-password`)
	}

	renderResetPassword(req, res) {
		const userId = req.session.uid
		if (!userId) {
			req.session.alert = {
				type: 'danger',
				message: 'Session expired. Please try again.',
			}
			return res.redirect('/auth/forgot-password')
		}
		res.render('auth/reset-password', { title: 'Reset password' })
	}

	async resetPassword(req, res) {
		try {
			const userId = req.session.uid
			if (!userId) {
				req.session.alert = {
					type: 'danger',
					message: 'Session expired. Please try again.',
				}
				return res.redirect('/auth/forgot-password')
			}

			const { password, confirmPassword } = req.body
			if (!password || !confirmPassword) {
				req.session.alert = {
					type: 'danger',
					message: 'Both fields are required.',
				}
				return res.render('auth/reset-password')
			}

			if (password !== confirmPassword) {
				req.session.alert = {
					type: 'danger',
					message: 'Passwords do not match.',
				}
				return res.render('auth/reset-password')
			}

			const user = await userModel.findById(userId)
			if (!user) {
				req.session.alert = {
					type: 'danger',
					message: 'User not found.',
				}
				return res.render('auth/reset-password')
			}

			user.password = await bcrypt.hash(password, 10)
			await user.save()

			req.session.alert = {
				type: 'success',
				message: 'Password reset successfully. You can now log in.',
			}
			req.session.destroy(() => {
				res.render('auth/login')
			})
		} catch (error) {
			console.log(error)
		}
	}
}

module.exports = new AuthController()
