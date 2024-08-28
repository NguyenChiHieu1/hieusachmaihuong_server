const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var sliderSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    //trỏ đến trang?
    link: {
        type: String,
        trim: true,
    },
    number: {
        type: Number,
        default: 1
    },
    status: {
        type: Boolean,
        default: true
    },
    endDate: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

//Export the model
module.exports = mongoose.model('Slider', sliderSchema);