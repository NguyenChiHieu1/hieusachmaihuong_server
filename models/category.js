const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  // Sửa lại thành 'Category'
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);