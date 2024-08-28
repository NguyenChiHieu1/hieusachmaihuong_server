const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    images: [{
        type: String,
        trim: true,
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
    },
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('News', newsSchema);
