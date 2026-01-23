require('dotenv').config()

const express = require('express')
const { engine } = require('express-handlebars')
const path = require('path')
const session = require('express-session')
const { default: mongoose } = require('mongoose')
const hbsHelper = require('./helpers/hbs')
const adminMiddleware = require('./middlewares/admin.middleware')
const authMiddleware = require('./middlewares/auth.middleware')
const errorMiddleware = require('./middlewares/error.middleware')
const AppError = require('./utils/error')
const multer = require('multer')

const app = express()

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/images')
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname)
	},
})

// middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(multer({ storage }).single('myFile'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(
	session({
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: true,
	}),
)

// view engine
app.engine('handlebars', engine({ helpers: hbsHelper }))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

app.use((req, res, next) => {
	res.locals.alert = req.session.alert
	res.locals.user = req.session.user
	delete req.session.alert
	next()
})

// Routes
app.use(require('./routes/shop.route'))
app.use('/admin', adminMiddleware, require('./routes/admin.route'))
app.use('/orders', authMiddleware, require('./routes/order.route'))
app.use('/auth', require('./routes/auth.route'))

app.use((req, res, next) => {
	next(new AppError('Page not found', 404))
})

app.use(errorMiddleware)

const PORT = process.env.PORT

async function bootstrap() {
	try {
		mongoose.connect(process.env.MONGO_URI)
		console.log('Connected to DB')

		app.listen(PORT, () =>
			console.log(`Server is running on http://localhost:${PORT}`),
		)
	} catch (error) {
		console.log(`Error: ${error}`)
	}
}

bootstrap()
