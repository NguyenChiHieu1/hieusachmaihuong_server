const address = require('../models/address');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

const normalizeString = (str) => {
    return str
        .trim()                        // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
        .replace(/\s+/g, '')           // Loại bỏ tất cả các khoảng trắng (bao gồm khoảng trắng giữa các từ)
        .toLowerCase();                // Chuyển tất cả ký tự thành chữ thường
};

// Tạo mới địa chỉ
const createAddress = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    const streetFromRequest = normalizeString(req.body.street);
    const existingAddress = await address.findOne({ street: new RegExp(`^${streetFromRequest}$`, 'i') }).select("street");

    if (existingAddress) {
        return res.status(400).json({
            success: false,
            msg: "Address already exists",
        });
    }

    const newAddress = await address.create(req.body);
    if (!newAddress) throw new Error('Cannot create new address!!!');
    res.status(201).json({
        success: true,
        msg: 'Address created successfully',
        data: newAddress
    });
});

// Lấy danh sách địa chỉ
const getAllAddresses = asyncHandler(async (req, res) => {
    const addressList = await address.find();
    if (!addressList) throw new Error('Cannot find addresses!!!');
    res.status(200).json({
        success: true,
        data: addressList
    });
});

// Lấy thông tin địa chỉ theo ID
const getAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new Error('Missing input params');
    const addressId = await address.findById(id);
    if (!addressId) throw new Error('Address not found');
    res.status(200).json({
        success: true,
        data: addressId
    });
});

// Cập nhật địa chỉ
const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || Object.keys(req.body).length === 0) throw new Error('Missing input');
    const updatedAddress = await address.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedAddress) throw new Error('Address update failed!!!');
    res.status(200).json({
        success: true,
        msg: 'Address updated successfully',
        data: updatedAddress
    });
});

// Xóa địa chỉ
const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new Error('Missing input params');

    const deletedAddress = await address.findByIdAndDelete(id);
    if (!deletedAddress) throw new Error('Address delete failed!!!');
    res.status(200).json({
        success: true,
        msg: 'Address deleted successfully'
    });
});

module.exports = {
    createAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress
};
