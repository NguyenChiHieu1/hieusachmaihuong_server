const { body } = require('express-validator');

module.exports.orderValidations = [
    // Validation for items array
    body('items')
        .isArray({ min: 1 }).withMessage('Items should be an array with at least one product'),

    body('items.*.productId')
        .not().isEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId'),

    body('items.*.name')
        .not().isEmpty().withMessage('Product name is required')
        .trim().isLength({ min: 3, max: 100 }).withMessage('Product name should be between 3 and 100 characters'),

    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Quantity should be a positive integer'),

    body('items.*.price')
        .isFloat({ min: 0 }).withMessage('Price should be a positive number'),

    body('items.*.discount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Discount should be a positive number'),

    body('items.*.color')
        .not().isEmpty().withMessage('Product color is required')
        .trim().isLength({ min: 3, max: 50 }).withMessage('Color should be between 3 and 50 characters'),

    body('customer')
        .not().isEmpty().withMessage('Customer ID is required')
        .isMongoId().withMessage('Customer ID must be a valid MongoDB ObjectId'),

    body('totalAmount')
        .isFloat({ min: 0 }).withMessage('Total amount should be a positive number'),

    body('paymentMethod')
        .not().isEmpty().withMessage('Payment method is required')
        .isIn(['card', 'bank_transfer', 'COD']).withMessage('Invalid payment method'),

    body('shippingAddress.recipientName')
        .not().isEmpty().withMessage('Recipient name is required')
        .trim().isLength({ min: 3, max: 100 }).withMessage('Recipient name should be between 3 and 100 characters'),

    body('shippingAddress.recipientNumber')
        .not().isEmpty().withMessage('Recipient phone number is required')
        .isLength({ min: 10, max: 15 }).withMessage('Phone number should be between 10 and 15 digits'),

    body('shippingAddress.city')
        .not().isEmpty().withMessage('City is required')
        .trim().isLength({ min: 2, max: 100 }).withMessage('City should be between 2 and 100 characters'),

    body('shippingAddress.country')
        .not().isEmpty().withMessage('Country is required')
        .trim().isLength({ min: 2, max: 100 }).withMessage('Country should be between 2 and 100 characters'),

    body('shippingAddress.line1')
        .not().isEmpty().withMessage('Address line 1 is required')
        .trim().isLength({ min: 5, max: 200 }).withMessage('Address line 1 should be between 5 and 200 characters'),

    body('shippingAddress.line2')
        .optional()
        .trim().isLength({ max: 200 }).withMessage('Address line 2 should not exceed 200 characters'),

    body('shippingAddress.postal_code')
        .not().isEmpty().withMessage('Postal code is required')
        .trim().isLength({ min: 4, max: 10 }).withMessage('Postal code should be between 4 and 10 characters'),

    body('shippingAddress.state')
        .optional()
        .trim().isLength({ max: 100 }).withMessage('State should not exceed 100 characters'),

    body('orderStatus')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Order status must be one of "pending", "processing", "shipped", "delivered", "cancelled"'),

    body('notes')
        .optional()
        .trim().isLength({ max: 500 }).withMessage('Notes should not exceed 500 characters'),
];
