const { body } = require('express-validator');

module.exports.sliderValidations = [
    // body('image').not().isEmpty().withMessage('Title cannot be empty'),

    body('title').not().isEmpty().withMessage('Title cannot be empty'),

    body('link')
        .optional()
        .isString().withMessage('Link must be a string')
        .isURL().withMessage('Link must be a valid URL'),

    body('order')
        .optional()
        .isInt({ min: 1 }).withMessage('Order must be a positive integer'),

    body('status')
        .optional()
        .isBoolean().withMessage('Status must be a boolean value'),

    body('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid date')
];

