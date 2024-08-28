const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    }],
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
