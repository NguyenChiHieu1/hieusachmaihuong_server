const { body } = require('express-validator');

const addItemToCartValidations = [
    // body('userId').isMongoId().withMessage('Invalid userId'),
    body('product').isMongoId().withMessage('Product must be a valid ObjectId'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
    body('color').optional().isString().withMessage('Color must be a string'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('discount').optional().isMongoId().withMessage('Discount must be a valid ObjectId'),
];

module.exports = {
    addItemToCartValidations,
};
