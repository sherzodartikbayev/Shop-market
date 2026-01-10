const adminController = require('../controllers/admin.controller')

const router = require('express').Router()

router.get('/add-product', adminController.renderAddProduct)
router.post('/add-product', adminController.addProduct)

router.get('/products', adminController.renderProducts)

router.get('/edit-product/:id', adminController.renderEditProduct)
router.post('/edit-product/:id', adminController.editProduct)

router.post('/delete-product/:id', adminController.deleteProduct)

module.exports = router
