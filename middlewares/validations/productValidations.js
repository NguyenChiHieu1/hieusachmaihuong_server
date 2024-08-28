const { body } = require('express-validator');

module.exports.productValidations = [
    body('name')
        .not().isEmpty().withMessage('Name is required')
        .trim().isLength({ min: 3, max: 100 }).withMessage('Name should be between 3 and 100 characters'),

    body('description')
        .not().isEmpty().withMessage('Description is required')
        .trim()
        .isLength({ max: 10000 }).withMessage('Description should not exceed 500 characters'),

    body('price').isInt({ min: 0 }).withMessage('Price must be a positive number'),

    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

    body('coupons').optional().isMongoId().withMessage('Coupons must be a valid MongoDB ObjectId'),

    body('category').isMongoId().withMessage('Category must be a valid MongoDB ObjectId'),

    body('status')
        .optional()
        .isIn(['available', 'out_of_stock', 'discontinued']).withMessage('Status must be one of "available", "out_of_stock", "discontinued"'),

    body('brand')
        .optional()
        .isMongoId().withMessage('Brand must be a valid MongoDB ObjectId'),

];