function authMiddleware(req, res, next) {
	if (!req.session.user) {
		req.session.alert = { type: 'danger', message: 'Please log in.' }
		res.redirect('/auth/login')
	}

	return next()
}

module.exports = authMiddleware
