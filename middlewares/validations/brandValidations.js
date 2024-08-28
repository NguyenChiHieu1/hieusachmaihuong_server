const { body } = require('express-validator');

module.exports.brandValidations = [
    body('name').not().isEmpty().trim().withMessage('Name is required'),
    body('address').isMongoId().withMessage('Address must be a valid MongoDB ObjectId'),
    body('email').isEmail().normalizeEmail().trim().escape().withMessage('email is required'),

];
