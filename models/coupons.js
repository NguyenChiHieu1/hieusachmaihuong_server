const mongoose = require('mongoose');

var couponsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
    },
    discount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    image: {
        type: String,
    },
    discountProduct: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Coupons', couponsSchema);