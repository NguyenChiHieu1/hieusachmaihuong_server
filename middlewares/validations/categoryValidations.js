const { body } = require('express-validator');

module.exports.categoryValidations = [
    body('name').not().isEmpty().trim().withMessage('Name is required!!!'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description should not exceed 500 characters!!!'),
    // body('parentCategory').optional().isMongoId().withMessage('Parent Category must be a valid MongoDB ObjectId!!!')
];