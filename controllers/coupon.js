const Coupons = require("../models/coupons")
const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const { deleteImages } = require('../utils/images')

const createCoupon = asyncHandler(async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const image = req.file;
    console.log(image)
    console.log(req.file)
    if (!image) {
        res.status(400).json({
            success: false,
            message: "Please provide an image"
        })
    }
    const coupon = await Coupons.create({ ...req.body, image: image.path });
    if (!coupon) throw new Error('Cannot create new coupon!!!')
    res.status(201).json({
        success: true,
        msg: 'Coupon created successfully',
        data: coupon
    });
});

// Get all coupons
const getAllCoupons = asyncHandler(async (req, res) => {
    const couponList = await coupons.find({ discountProduct: { $ne: [] }, status: true }).populate({
        path: 'discountProduct',
        select: 'name _id'
    });
    if (!couponList) throw new Error('Cannot find coupon!!!')
    res.status(200).json({
        success: true,
        data: couponList
    });
});

const getCoupons = asyncHandler(async (req, res) => {
    // Copy các query từ req.query và loại bỏ các trường không cần thiết
    const queries = { ...req.query };
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);

    // Chuyển đổi các toán tử so sánh thành định dạng MongoDB
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formattedQueries = JSON.parse(queryString);

    // Thêm điều kiện lọc tên mã giảm giá nếu có
    if (queries?.code) {
        formattedQueries.code = { $regex: queries.code, $options: 'i' };
    }

    // Thêm điều kiện bỏ qua các mã giảm giá có tên bắt đầu với 'default'
    formattedQueries.name = {
        ...formattedQueries.name,
        $not: { $regex: /^default/, $options: 'i' }
    };

    // Tạo query command với các populate nếu cần
    let queryCommand = Coupons.find(formattedQueries);

    // Sắp xếp kết quả nếu có query sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    }

    // Giới hạn các trường kết quả nếu có query fields
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Phân trang kết quả
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_COUPONS;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {
        // Thực thi query command và đếm số lượng tài liệu phù hợp
        const listCoupons = await queryCommand.exec();
        const count = await Coupons.countDocuments(formattedQueries);

        return res.status(200).json({
            success: true,
            data: listCoupons,
            counts: count,
            currentPage: page,
            totalPage: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get coupons',
            error: err.message
        });
    }
});
const getAllDiscounts = asyncHandler(async (req, res) => {
    const couponList = await Coupons.find({ discountProduct: { $size: 0 }, status: true }).sort({ discount: 1 })
    if (!couponList) throw new Error('Cannot find discounts!!!')
    res.status(200).json({
        success: true,
        data: couponList
    });
});
// Get a single coupon by ID
const getCouponById = asyncHandler(async (req, res) => {
    const { _cid } = req.params
    if (!_cid) throw new Error('Missing input params')
    const coupFindId = await Coupons.findById(_cid).populate('discountProduct');
    if (!coupFindId) throw new Error('Coupon not found')
    res.status(200).json({
        success: true,
        data: coupFindId
    });

});

// Update a coupon
const updateCoupon = asyncHandler(async (req, res) => {
    const { _cid } = req.params
    const image = req.file?.path;
    if (!_cid || Object.keys(req.body).length === 0) throw new Error('Missing input')
    const couponNew = await Coupons.findByIdAndUpdate(_cid, { ...req.body, image }, { new: true }).populate('discountProduct');
    if (!couponNew) throw new Error('Coupon update failed!!!')
    res.status(200).json({
        success: true,
        msg: 'Coupon updated successfully',
        data: couponNew
    });
});

// Delete a coupon
const deleteCoupon = asyncHandler(async (req, res) => {
    const { _cid } = req.params
    if (!_cid) throw new Error('Missing input params')


    const couponDelete = await Coupons.findById(_cid);
    if (!couponDelete) throw new Error('Coupon no found!!!')
    let arrImage = [];
    if (couponDelete.image) {
        arrImage.push(couponDelete.image);
        let deleteImageOld = deleteImages(arrImage);
        if (deleteImageOld) {
            console.log('Delete image success!!!')
            await Coupons.findByIdAndDelete(_cid);
        }
        else console.log("Delete image false!")
    }
    res.status(200).json({
        success: true,
        msg: 'Coupon deleted successfully'
    });

});

module.exports = {
    createCoupon,
    getAllCoupons,
    getAllDiscounts,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    getCoupons
};