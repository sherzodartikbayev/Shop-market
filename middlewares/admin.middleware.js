function adminMiddleware(req, res, next) {
	if (!req.session.user) {
		req.session.alert = { type: 'danger', message: 'Please log in.' }
		res.redirect('/auth/login')
	}

	if (!req.session.user.isAdmin) {
		req.session.alert = { type: 'danger', message: 'You are not admin.' }
		res.redirect('/')
	}

	return next()
}

module.exports = adminMiddleware
