const { query } = require('express');
const product = require('../models/product')
const Category = require('../models/category')
const asyncHandler = require('express-async-handler')
const { validationResult } = require('express-validator')
const slugify = require('slugify')
const { uploadImageFile, deleteImages, uploadImageUrl } = require("../utils/images")

function isEmpty(value) {
    return value === undefined || value === null || (Array.isArray(value) && value.length === 0);
}

const createProduct = asyncHandler(async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: err.array()
        });
    }

    const { name } = req.body;
    const files_arr = req.files || [];
    console.log(files_arr)
    if (!isEmpty(files_arr) && files_arr.length > 10) {
        res.status(400).json({
            success: false,
            errors: [{
                msg: "Maximum 10 images upload!!!"
            }]
        })
    }

    const nameCheck = await product.findOne({ name: name });
    if (nameCheck) return res.status(400).json({
        success: false,
        errors: [{
            msg: `Name ${name} already exists!!!`,
        }]
    })

    let newImageUrls = [];
    if (!isEmpty(files_arr) && (files_arr.length > 0)) {
        newImageUrls = await uploadImageFile(files_arr);
        if (newImageUrls.length === 0) throw new Error('Upload image new failed!');
        console.log('Upload image new successfully!!!');
    }

    req.body.slug = slugify(req.body.name)
    req.body.images = newImageUrls;

    const newProduct = await product.create(req.body)
    if (!newProduct) throw new Error("Cannot create new product!!!")
    res.status(200).json({
        success: true,
        msg: 'Product created successfully',
        data: newProduct
    });
});

const getAllProduct = asyncHandler(async (req, res) => {
    const newProduct = await product.find().populate({
        path: 'category',
        select: 'name description parentCategory'
    }
    ).populate({
        path: 'coupons',
        select: 'name discount',
    }).populate({
        path: 'brand',
        select: 'name'
    })
    if (!newProduct) throw new Error("Cannot find new product!!!")
    res.status(200).json({
        success: true,
        total: newProduct.length,
        msg: 'Product find successfully',
        data: newProduct
    });
})

const getProducts = asyncHandler(async (req, res) => {
    const queries = { ...req.query };

    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);
    // console.log("excludeFields", excludeFields);

    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formatedQueries = JSON.parse(queryString);

    // Thay đổi điều kiện cho trường 'name'
    if (queries?.name) formatedQueries.name = { $regex: queries.name, $options: 'i' };

    // console.log("formatedQueries", formatedQueries);

    // Tạo truy vấn cơ bản cho sản phẩm
    let queryCommand = product.find(formatedQueries)
        .populate({ path: 'category', select: 'name description' })
        .populate({ path: 'coupons', select: 'name discount' })
        .populate({ path: 'brand', select: 'name' });


    // Xử lý sắp xếp
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort({ createdAt: -1 });
    }

    // Xử lý giới hạn trường
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Xử lý phân trang
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_PRODUCTS;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {
        const listProduct = await queryCommand.exec();
        const counts = await product.find(formatedQueries).countDocuments();
        return res.status(200).json({
            success: true,
            counts: counts,
            currentPage: page,
            totalPage: Math.ceil(counts / limit),
            data: listProduct,

        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get products',
            error: err.message
        });
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    // const { name, color, sizes, price, quantity, sold, discount, category, description } = req.body;
    const { name, color, sizes, price, quantity, sold, discount, category, description, cloudinaryImages } = req.body;
    const pid = req.params.pid;
    const files_image = req.files;

    // Lấy sản phẩm hiện tại
    const productNew = await product.findById(pid);
    if (!productNew) throw new Error("Product not found!");

    // console.log('ảnh mới trong file:', files_image)
    // console.log('ảnh mới trên cloudinary:', cloudinaryImages)
    // console.log('ảnh cũ trong database:', productNew.images)

    // Tạo mảng chứa các ảnh cũ database
    const oldListImages = productNew.images;
    // Mảng chứa các URL ảnh sẽ được lưu trữ
    let newImageUrls = [];

    //Mảng các ảnh sau khi so sánh được xếp vào lưu/xóa>??
    let imagesToSave = [];
    let imagesToDelete = [];

    // Xử lý ảnh mới 
    if (!isEmpty(files_image) && (files_image.length > 0)) {
        newImageUrls = await uploadImageFile(files_image);
        if (newImageUrls.length === 0) throw new Error('Upload image new failed!');
        // console.log('Upload image new successfully!!!');
        // console.log('Upload image:', newImageUrls);

    }
    //2 TH có cloudinaryImages -> và k có cloudinaryImages
    if (!isEmpty(cloudinaryImages) && (cloudinaryImages.length > 0)) {
        oldListImages.forEach((it) => {
            if (cloudinaryImages.includes(it)) {
                imagesToSave.push(it);
            } else {
                imagesToDelete.push(it);
            }
        })
    } else {
        imagesToDelete = oldListImages;
    }

    //xóa ảnh mà ko trùng 
    if (!isEmpty(imagesToDelete) && (imagesToDelete.length > 0)) {
        const statusDel = await deleteImages(imagesToDelete);
        if (!statusDel) throw new Error('Delete image old failed!');
        console.log('Delete image old successful!!!');
    }
    if (!isEmpty(imagesToSave) && (imagesToSave.length > 0)) {
        imagesToSave.map((it) => {
            newImageUrls.push(it)
        })
    }
    productNew.images = newImageUrls || productNew.images;

    // console.log("Ảnh lưu:", productNew.images)
    // Cập nhật mảng ảnh mới
    // Cập nhật thông tin sản phẩm
    productNew.name = name || productNew.name;
    productNew.color = color || productNew.color;
    productNew.sizes = sizes || productNew.sizes;
    productNew.price = price || productNew.price;
    productNew.quantity = quantity || productNew.quantity;
    productNew.sold = sold || productNew.sold;
    productNew.discount = discount || productNew.discount;
    productNew.category = category || productNew.category;
    productNew.description = description || productNew.description;

    // Lưu sản phẩm đã cập nhật
    const savePro = await productNew.save();
    if (!savePro) throw new Error("Product update failed!");
    res.status(200).json({
        success: true,
        msg: 'Product update successfully',
        data: productNew
    });
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const findProduct = await product.findById(pid)
    if (!findProduct) {
        return res.status(404).json({
            success: false,
            errors: [{
                msg: 'Product not found!!!',
            }]
        })
    }
    // Xóa ảnh cũ
    if (findProduct.images.length > 0) {
        const deleteImg = await deleteImages(findProduct.images)
        if (!deleteImg) throw new Error("Delete image failed!!")
    }
    const deleteProduct = await product.findByIdAndDelete(pid)
    if (!deleteProduct) throw new Error("Delete product failed!!!")

    res.status(200).json({
        success: true,
        msg: 'Product delete successfully',
        deleteProduct
    });
})

const addRating = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const { star, comment } = req.body;
    const { _id: userId } = req.info_user;
    let idPro = pid.trim();
    try {
        const productRating = await product.findById(idPro);

        if (!productRating) {
            res.status(404).json({
                success: false,
                msg: "Product not found"
            })
        }
        productRating.ratings.push({
            star,
            comment,
            postedBy: userId
        });
        productRating.totalRatings = productRating.ratings.length;

        const updatedProduct = await productRating.save();
        res.status(200).json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: error.message
        })
    }
});

const getProductId = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    if (!pid) {
        return res.status(400).json({
            success: false,
            message: 'Product ID (pid) is required',
        });
    }

    try {
        // Truy vấn sản phẩm dựa trên pid
        const findProduct = await product.findById(pid)
            .populate("coupons")
            .populate("ratings.postedBy", "name avatar")
            .populate({ path: 'category', select: 'name parentCategory' });

        if (!findProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Truy vấn ngược để lấy thông tin danh mục cấp 3, 2, 1
        const level3Category = await Category.findById(findProduct.category)
            .populate({ path: 'parentCategory', select: 'name parentCategory' });

        let level1 = null, level2 = null, level3 = null;
        let level1Id = null, level2Id = null, level3Id = null;

        if (level3Category) {
            level3 = level3Category.name;
            level3Id = level3Category._id;

            if (level3Category.parentCategory) {
                const level2Category = level3Category.parentCategory;
                level2 = level2Category.name;
                level2Id = level2Category._id;

                if (level2Category.parentCategory) {
                    const level1Category = await Category.findById(level2Category.parentCategory);
                    if (level1Category) {
                        level1 = level1Category.name;
                        level1Id = level1Category._id;
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: findProduct,
            categories: {
                level1: { id: level1Id, name: level1 },
                level2: { id: level2Id, name: level2 },
                level3: { id: level3Id, name: level3 }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
// tận dụng ko cần delete database
const apiSave = asyncHandler(async (req, res) => {
    try {
        const data = await product.find();
        const savePromises = data.map((item) => item.save());
        await Promise.all(savePromises);

        res.status(200).json({
            success: true,
            msg: 'Data saved successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: error.message
        })
    }
})

const getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.query;

    if (!category) {
        return res.status(400).json({
            success: false,
            message: 'Category ID is required',
        });
    }

    try {
        const categoryReq = await Category.findById(category);
        if (!categoryReq) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Xác định loại danh mục và lấy ID của các danh mục
        let level, nameCate1, nameCate2, nameCate3;
        let idCate1, idCate2, idCate3;
        if (!categoryReq.parentCategory) {
            level = 'level1';  // Danh mục cấp 1
            nameCate1 = categoryReq.name;
            idCate1 = categoryReq._id;
        } else {
            const parentCategoryReq = await Category.findById(categoryReq.parentCategory).populate("parentCategory");
            if (!parentCategoryReq.parentCategory) {
                level = 'level2';
                nameCate1 = parentCategoryReq.name;
                idCate1 = parentCategoryReq._id;
                nameCate2 = categoryReq.name;
                idCate2 = categoryReq._id;
            } else {
                level = 'level3';
                nameCate1 = parentCategoryReq.parentCategory.name;
                idCate1 = parentCategoryReq.parentCategory._id;
                nameCate2 = parentCategoryReq.name;
                idCate2 = parentCategoryReq._id;
                nameCate3 = categoryReq.name;
                idCate3 = categoryReq._id;
            }
        }

        let level3CategoryIds = [];  // Danh sách ID danh mục cấp 3
        let level2CategoryIds = [];  // Danh sách ID danh mục cấp 2

        if (level === 'level3') {
            level3CategoryIds.push(category);  // Nếu là danh mục cấp 3, chỉ cần ID của danh mục cấp 3 hiện tại
        } else if (level === 'level2') {
            // Lấy tất cả danh mục cấp 3 thuộc danh mục cấp 2
            const level3Categories = await Category.find({ parentCategory: category });
            level3CategoryIds = level3Categories.map(cat => cat._id);
        } else if (level === 'level1') {
            // Lấy tất cả danh mục cấp 2 thuộc danh mục cấp 1
            const level2Categories = await Category.find({ parentCategory: category });
            level2CategoryIds = level2Categories.map(cat => cat._id);
            // Lấy tất cả danh mục cấp 3 thuộc danh mục cấp 2
            const level3Categories = await Category.find({ parentCategory: { $in: level2CategoryIds } });
            level3CategoryIds = level3Categories.map(cat => cat._id);
        }

        // Sao chép các query từ req.query và loại bỏ các trường không cần thiết
        const queries = { ...req.query };
        const excludeFields = ['limit', 'sort', 'page', 'fields'];
        excludeFields.forEach(field => delete queries[field]);

        // Chuyển đổi và định dạng các trường query
        let queryString = JSON.stringify(queries);
        queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
        const formatedQueries = JSON.parse(queryString);

        // Thay đổi điều kiện cho trường 'name'
        if (queries?.name) formatedQueries.name = { $regex: queries.name, $options: 'i' };

        // Tạo truy vấn cơ bản cho sản phẩm
        let queryCommand = product.find({ ...formatedQueries, category: { $in: level3CategoryIds } })
            .populate({ path: 'category', select: 'name' })
            .populate({ path: 'coupons', select: 'name discount' })
            .populate({ path: 'brand', select: 'name' });

        // Xử lý sắp xếp
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            queryCommand = queryCommand.sort(sortBy);
        } else {
            queryCommand = queryCommand.sort({ createdAt: -1 });
        }

        // Xử lý giới hạn trường
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            queryCommand = queryCommand.select(fields);
        }

        // Xử lý phân trang
        const page = +req.query.page || 1;
        const limit = +req.query.limit || 10;
        const skip = (page - 1) * limit;
        queryCommand.skip(skip).limit(limit);

        const products = await queryCommand.exec();
        const totalProducts = await product.countDocuments({ ...formatedQueries, category: { $in: level3CategoryIds } });

        return res.status(200).json({
            success: true,
            data: products,
            totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            category: {
                level1: {
                    id: idCate1,
                    name: nameCate1,
                },
                level2: {
                    id: idCate2,
                    name: nameCate2,
                    listCate: level2CategoryIds,
                },
                level3: {
                    id: idCate3,
                    name: nameCate3,
                    listCate: level3CategoryIds
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


module.exports = {
    createProduct,
    getAllProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    addRating,
    apiSave,
    getProductsByCategory,
    getProductId
}