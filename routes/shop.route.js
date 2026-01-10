const shopController = require('../controllers/shop.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = require('express').Router()

router.get('/', shopController.renderHomePage)

router.get('/cart', authMiddleware, shopController.renderCart)
router.post('/cart/:id', authMiddleware, shopController.addToCart)

router.post('/cart/update/:id', shopController.updateCartItem)

router.post('/cart/delete/:id', shopController.deleteFromCart)

module.exports = router
