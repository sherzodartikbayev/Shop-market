const hbsHelper = {
	calcTotal: (price, quantity) => {
		const total = price * quantity
		return total.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
		})
	},

	formatUSD: price => {
		return price.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
		})
	},

	formatDate: date => {
		const d = new Date(date)
		return d.toISOString().split('T')[0]
	},
}

module.exports = hbsHelper
