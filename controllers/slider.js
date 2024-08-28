const Slider = require('../models/slider');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary.cofig')

function extractPublicId(url) {
    const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/`;
    let publicId = url.replace(prefix, ''); // Loại bỏ phần tiền tố URL
    publicId = publicId.replace(/v\d+\/(.+)\.\w+$/, '$1'); // Loại bỏ phần tiền tố phiên bản và phần mở rộng tệp
    return publicId;
}

const createSlider = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    let updateFile = { ...req.body }
    if (req.file.path) updateFile = { ...updateFile, image: req.file.path }
    // console.log(updateFile)
    const slider = await Slider.create(updateFile);
    if (!slider) throw new Error('Cannot create slider!');
    res.status(201).json({
        success: true,
        msg: 'Slider created successfully',
        // data: slider
    });
});

const getAllSliders = asyncHandler(async (req, res) => {
    const sliders = await Slider.find();
    if (!sliders) throw new Error('No sliders found!');

    res.status(200).json({
        success: true,
        data: sliders
    });
});

const getSliderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new Error('Missing ID parameter');

    const slider = await Slider.findById(id);
    if (!slider) throw new Error('Slider not found!');

    res.status(200).json({
        success: true,
        data: slider
    });
});

const updateSlider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let updateFile = { ...req.body }
    if (req.file.path) updateFile = { ...updateFile, image: req.file.path }

    const slider = await Slider.findByIdAndUpdate(id, updateFile, { new: true });
    if (!slider) throw new Error('Slider update failed!');
    res.status(200).json({
        success: true,
        msg: 'Slider updated successfully',
        data: slider
    });
});

const deleteSlider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const findSlider = await Slider.findById(id)
    if (!findSlider) throw new Error("Not found slider!!!")
    await cloudinary.uploader.destroy(extractPublicId(findSlider.image))
    const deleteSlider = await Slider.findByIdAndDelete(id);
    if (!deleteSlider) throw new Error('Slider delete failed!');
    res.status(200).json({
        success: true,
        message: 'Slider deleted successfully'
    });
});

const uploadImage = asyncHandler(async (req, res) => {
    const { pid } = req.params
    if (!req.files) throw new Error("Missing input")
    const response = await Slider.findByIdAndUpdate(pid, { image: req.file }, { new: true })
    if (!response) throw new Error("Upload images failed!!!")
    res.status(200).json({
        success: true,
        msg: 'Upload images successfully',
    });

})

module.exports = {
    createSlider,
    getAllSliders,
    getSliderById,
    updateSlider,
    deleteSlider,
    uploadImage
}