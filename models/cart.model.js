const { Schema, model } = require('mongoose')

const cartSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
		items: [
			{
				quantity: { type: Number, default: 1 },
				product: { type: Schema.Types.ObjectId, ref: 'product' },
			},
		],
	},
	{ timestamps: true }
)

module.exports = model('cart', cartSchema)
