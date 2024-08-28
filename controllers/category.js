const category = require('../models/category')
const asyncHandler = require('express-async-handler')
const { validationResult } = require('express-validator')

const createCategory = asyncHandler(async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, description, parentCategory } = req.body;

    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await category.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({
            success: false,
            errors: [{
                msg: "Category already exists",
            }]
        });
    }
    // Tạo danh mục mới
    //cẩn thận vs {new:true} mongoosee se tự động tạo cái ms => lỗi name là bắt buộc (new:true dung chp update)
    //=> khi create khong thêm new:true
    const newCategory = await category.create({ name, description, parentCategory });
    if (!newCategory) throw new Error("Category create failed")
    return res.status(201).json({
        success: true,
        msg: 'Category created successfully',
        data: newCategory
    });
});

const updateCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;

    if (!cid || Object.keys(req.body).length === 0) throw new Error('Missing inputs')

    const updatedCategory = await category.findByIdAndUpdate(
        cid, req.body, { new: true, runValidators: true }
    );

    if (!updatedCategory) throw new Error("Category update failed!!!")
    return res.status(200).json({
        success: true,
        msg: 'Category updated successfully',
        data: updatedCategory
    });
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    if (!cid) throw new Error('Missing inputs')
    // Xóa danh mục
    const deletedCategory = await category.findByIdAndDelete(cid);
    if (!deletedCategory) throw new Error("Category delete failed!!!")
    return res.status(200).json({
        success: true,
        msg: 'Category deleted successfully',
    })
})

const getCategories = asyncHandler(async (req, res) => {
    // Sao chép các query từ req.query và loại bỏ các trường không cần thiết
    const queries = { ...req.query };
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);

    // Chuyển đổi và định dạng các trường query
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formattedQueries = JSON.parse(queryString);

    // Thêm điều kiện lọc tên danh mục nếu có
    if (req.query.name) {
        formattedQueries.name = { $regex: req.query.name, $options: 'i' };
    }

    // Tạo query command với các populate nếu cần
    let queryCommand = category.find(formattedQueries).populate({
        path: 'parentCategory',
        select: 'name'
    });

    // Sắp xếp kết quả nếu có trường sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort({ createdAt: -1 });
    }

    // Giới hạn các trường kết quả nếu có trường fields
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Phân trang kết quả
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 2;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {

        const listCategory = await queryCommand.exec();
        const count = await category.countDocuments(formattedQueries);

        return res.status(200).json({
            success: true,
            data: listCategory,
            counts: count,
            currentPage: page,
            totalPage: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get categories',
            error: err.message
        });
    }
});

const getParent123Category = asyncHandler(async (req, res) => {
    try {
        // Lấy tất cả danh mục gốc (cấp 1)
        const parentCategories = await category.find({ parentCategory: null });

        // Lấy tất cả danh mục cấp 2 (danh mục con của danh mục gốc)
        const childCategoriesLevel2 = await category.find({ parentCategory: { $ne: null } });

        // Lấy tất cả danh mục cấp 3 (danh mục con của danh mục cấp 2)
        const childCategoriesLevel3 = await category.find({ parentCategory: { $in: childCategoriesLevel2.map(cat => cat._id) } });

        // Phân loại danh mục cấp 2 theo danh mục gốc
        const categoryMapLevel2 = new Map();
        childCategoriesLevel2.forEach(child => {
            const parentId = child.parentCategory.toString();
            if (!categoryMapLevel2.has(parentId)) {
                categoryMapLevel2.set(parentId, []);
            }
            categoryMapLevel2.get(parentId).push(child);
        });

        // Phân loại danh mục cấp 3 theo danh mục cấp 2
        const categoryMapLevel3 = new Map();
        childCategoriesLevel3.forEach(child => {
            const parentId = child.parentCategory.toString();
            if (!categoryMapLevel3.has(parentId)) {
                categoryMapLevel3.set(parentId, []);
            }
            categoryMapLevel3.get(parentId).push(child);
        });

        // Cấu trúc danh mục với các cấp 2 và cấp 3
        const categorizedCategories = parentCategories.map(parent => {
            const childrenLevel2 = categoryMapLevel2.get(parent._id.toString()) || [];

            // Cấu trúc cấp 2 với các cấp 3
            const structuredChildrenLevel2 = childrenLevel2.map(child => ({
                ...child.toObject(),
                children: categoryMapLevel3.get(child._id.toString()) || []
            }));

            return {
                parent: parent,
                children: structuredChildrenLevel2
            };
        });

        return res.status(200).json({
            success: true,
            data: categorizedCategories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message
        });
    }
});

const getAllCategory = asyncHandler(async (req, res) => {
    try {
        const allCategories = await category.find().populate({
            path: 'parentCategory',
            select: ' name',
        });
        if (!allCategories) throw new Error('Not find category')
        return res.status(200).json({
            success: true,
            data: allCategories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message
        });
    }
});

const getCategoryChild = asyncHandler(async (req, res) => {
    const childCategories = await category.find({ parentCategory: { $ne: null } });
    if (!childCategories) throw new Error("Category child null")
    return res.status(200).json({
        success: true,
        data: childCategories
    });
})
const getCategoriesLevel1And2 = asyncHandler(async (req, res) => {
    try {
        const level1Categories = await category.find({ parentCategory: null }).lean().exec();

        const level2Categories = await category.find({ parentCategory: { $ne: null } }).lean().exec();

        let arr = [...level1Categories]
        const combinedCategories = level1Categories.map(level1 => {
            const children = level2Categories.filter(level2 =>
                level2.parentCategory && level2.parentCategory.equals(level1._id)
            );
            if (children !== null) {
                arr = [...arr, ...children]
            }
        });
        // const level2 = level2Categories.filter(

        // )

        return res.status(200).json({
            success: true,
            data: arr,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});

const getCategoriesLevel3 = asyncHandler(async (req, res) => {
    try {

        const level1Categories = await category.find({ parentCategory: null }).lean().exec();

        // Lấy tất cả các danh mục cấp độ 2 (các danh mục có parentCategory thuộc vào level 1)
        const level2Categories = await category.find({ parentCategory: { $in: level1Categories.map(cat => cat._id) } }).lean().exec();

        // Lấy tất cả các danh mục cấp độ 3 (các danh mục có parentCategory thuộc vào level 2)
        const level3Categories = await category.find({ parentCategory: { $in: level2Categories.map(cat => cat._id) } }).lean().exec();

        return res.status(200).json({
            success: true,
            data: level3Categories,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});

const getNameCateClient = asyncHandler(async (req, res) => {
    const { id
    } = req.params;
    try {
        const cate = await category.findById(id).lean().exec();
        if (!cate) {
            return res.status(404).json({
                success: false,
                msg: 'Category not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: cate.name
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message
        });
    }
})
module.exports = {
    createCategory,
    updateCategory,
    getAllCategory,
    deleteCategory,
    getCategoryChild,
    getCategoriesLevel1And2,
    getParent123Category,
    getCategories,
    getCategoriesLevel3,
    getNameCateClient
}
