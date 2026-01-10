const orderController = require('../controllers/order.controller')

const router = require('express').Router()

router.get('/', orderController.renderOrders)
router.post('/place-order', orderController.placeOrder)

module.exports = router
