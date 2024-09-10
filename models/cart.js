const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        color: String,
        // size: String,
        // price: Number,
        // discount: { type: mongoose.Types.ObjectId, ref: 'Coupons' },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
