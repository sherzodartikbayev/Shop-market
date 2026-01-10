const { Schema, model } = require('mongoose')

const productSchema = new Schema(
	{
		title: { type: String, required: true },
		price: { type: Number, required: true },
		image: { type: String, required: true },
	},
	{ timestamps: true }
)

module.exports = model('product', productSchema)
