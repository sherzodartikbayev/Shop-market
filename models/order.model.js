const { Schema, model } = require('mongoose')

const orderSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
		products: [
			{
				quantity: { type: Number, default: 1 },
				product: { type: Schema.Types.ObjectId, ref: 'product' },
			},
		],
		totalPrice: { type: Number, required: true },
	},
	{ timestamps: true }
)

module.exports = model('order', orderSchema)
