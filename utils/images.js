const cloudinary = require("../config/cloudinary.cofig");
const stream = require('stream');

function extractPublicId(url) {
    const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/`;
    let publicId = url.replace(prefix, ''); // Loại bỏ phần tiền tố URL
    publicId = publicId.replace(/v\d+\/(.+)\.\w+$/, '$1');
    return publicId;
}

const uploadImageFile = async (files) => {
    if (!Array.isArray(files)) {
        throw new Error('files not array');
    }
    const imageUrls = await Promise.all(files.map(async (file) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'products' },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result.secure_url);
                    }
                }
            );

            const bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);
            bufferStream.pipe(uploadStream);
        });
    }));

    return imageUrls;
};

const uploadImageUrl = async (imageUrls) => {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error('No image URLs provided or not an array');
    }

    // Tạo một mảng các promise để upload các ảnh
    const uploadPromises = imageUrls.map(async (url) => {
        try {
            // Upload ảnh từ URL và lấy URL ảnh đã upload
            const result = await cloudinary.uploader.upload(url, {
                folder: 'products'
            });
            return result.secure_url;
        } catch (error) {
            // Log lỗi nhưng không ném ra ngoài, để tiếp tục upload các ảnh khác
            console.error(`Error uploading image from URL ${url}:`, error.message);
            return null;  // Trả về null để chỉ rõ rằng ảnh này không được upload
        }
    });

    try {
        // Chờ tất cả các promise hoàn thành
        const results = await Promise.all(uploadPromises);

        // Loại bỏ các giá trị null từ mảng kết quả
        const successfulUploads = results.filter(url => url !== null);

        return successfulUploads;  // Trả về các URL ảnh đã upload thành công
    } catch (error) {
        console.error('Error uploading images from URLs:', error.message);
        throw new Error('Failed to upload images from URLs');
    }
};

const deleteImages = async (images) => {
    let arrImage = []
    if (images.length > 0) {
        images.map((img) => {
            console.log(img)
            console.log('iamge-delete:', extractPublicId(img))
            return arrImage.push(extractPublicId(img));
        });
        const deletePromises = arrImage.map((publicId) => cloudinary.uploader.destroy(publicId));
        let status = await Promise.all(deletePromises);
        // let status = true;
        return status;
    }
    return false;
}

module.exports = {
    uploadImageFile,
    uploadImageUrl,
    deleteImages
}