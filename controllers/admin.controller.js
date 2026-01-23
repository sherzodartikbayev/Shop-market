const productModel = require('../models/product.model')

class AdminController {
	renderAddProduct(req, res) {
		res.render('admin/add-product', { title: 'Add product' })
	}

	async addProduct(req, res) {
		try {
			const { title, image, price } = req.body
			await productModel.create({ title, image: req.file.filename, price })
			res.redirect('/admin/products')
		} catch (err) {
			console.error(err)
			res.status(500).send('Error saving product')
		}
	}

	async renderProducts(req, res) {
		const products = await productModel.find().lean()
		res.render('admin/products', { title: 'Products', products })
	}

	async renderEditProduct(req, res) {
		const product = await productModel.findById(req.params.id).lean()
		res.render('admin/edit-product', { title: 'Edit Product', product })
	}

	async editProduct(req, res) {
		await productModel.findByIdAndUpdate(req.params.id, req.body)
		res.redirect('/admin/products')
	}

	async deleteProduct(req, res) {
		await productModel.findByIdAndDelete(req.params.id)
		res.redirect('/admin/products')
	}
}

module.exports = new AdminController()
