const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        unique: true,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        default: "Việt Nam",

    },
    postalCode: {
        type: String,

    },
    type: {
        type: String,
        default: 'home',
    },
}, { timestamps: true });


module.exports = mongoose.model('Address', addressSchema);
