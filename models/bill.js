const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var billSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amountDue: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'bank_transfer', 'COD']
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid', 'failed', 'refund']
    },
    paymentDate: {
        type: Date,
    },
    billAddress: {
        recipientName: { type: String },
        recipientNumber: { type: Number },
        city: { type: String, required: true },
        country: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        postal_code: { type: String },
        state: { type: String },
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

//Export the model
module.exports = mongoose.model('Bill', billSchema);
