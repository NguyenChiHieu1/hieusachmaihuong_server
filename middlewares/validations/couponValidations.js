const { body } = require('express-validator');

module.exports.couponValidations = [
    // body('name').not().isEmpty().trim().withMessage('Name is required'),
    // body('discount').isInt({ min: 0 }).withMessage('Discount must be a number')
    //     .not().isEmpty().withMessage('Discount is required'),
    // body('expiryDate')
    //     .isISO8601().withMessage('Expiry date must be a valid date')
    //     .not().isEmpty().withMessage('Expiry date is required'),
    // body('image')
    //     .optional().not().isEmpty().withMessage('Image URL is required')
    //     .isURL().withMessage('Image must be a valid URL'),
    // body('discountProduct')
    //     .optional()
    //     .isArray().withMessage('Discount products must be an array')
    //     .isMongoId().withMessage('All discount products must be valid ObjectId')
];
