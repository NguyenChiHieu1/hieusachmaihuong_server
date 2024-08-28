const cloudinary = require('./cloudinary.cofig')
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const multer = require('multer');
const storage = new CloudinaryStorage({
    cloudinary,
    allowedFormats: ['jpg', 'png', 'webp'],
    params: {
        folder: 'hieusach_maihuong'
    }
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;