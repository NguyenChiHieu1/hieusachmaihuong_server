const Brand = require('../models/brand');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

const createBrand = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const brand = await Brand.create(req.body);
    if (!brand) throw new Error('Cannot create new brand!');
    res.status(201).json({ success: true, msg: "Create new brand successfull" });
});

const getBrands = asyncHandler(async (req, res) => {
    // Copy các query từ req.query và loại bỏ các trường không cần thiết
    const queries = { ...req.query };
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);

    // Chuyển đổi các toán tử so sánh thành định dạng MongoDB
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formattedQueries = JSON.parse(queryString);

    // Thêm điều kiện lọc tên thương hiệu nếu có
    if (queries?.name) {
        formattedQueries.name = { $regex: queries.name, $options: 'i' };
    }

    // Tạo query command với các populate nếu cần
    let queryCommand = Brand.find(formattedQueries).populate({
        path: 'address',
    });

    // Sắp xếp kết quả nếu có query sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort({ createdAt: -1 });
    }

    // Giới hạn các trường kết quả nếu có query fields
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Phân trang kết quả
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_BRANDS;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {
        // Thực thi query command và đếm số lượng tài liệu phù hợp
        const listBrand = await queryCommand.exec();
        const count = await Brand.countDocuments(formattedQueries);

        return res.status(200).json({
            success: true,
            data: listBrand,
            counts: count,
            currentPage: page,
            totalPage: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get brands',
            error: err.message
        });
    }
});

// Get all brands
const getAllBrands = asyncHandler(async (req, res) => {
    const brands = await Brand.find().populate('address');
    if (!brands) throw new Error('Cannot find brand!');
    res.status(200).json({ success: true, data: brands });
});

// Get a brand by ID
const getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brand = await Brand.findById(id).populate('address');
    if (!brand) throw new Error('Brand not found!');
    res.status(200).json({ success: true, data: brand });
});

// Update a brand
const updateBrand = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const brand = await Brand.findByIdAndUpdate(id, req.body, { new: true }).populate('address');
    if (!brand) throw new Error('Cannot update brand!');
    res.status(200).json({ success: true, data: brand });
});

// Delete a brand
const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) throw new Error('Cannot delete brand!');
    res.status(200).json({ success: true, message: 'Brand deleted successfully' });
});

module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    getBrands
};
