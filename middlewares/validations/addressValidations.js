const { body } = require('express-validator');

module.exports.addressValidations = [
    body('street').not().isEmpty().trim().withMessage('Street is required'),
    body('district').not().isEmpty().trim().withMessage('District is required'),
    body('city').not().isEmpty().trim().withMessage('City is required'),
    body('country').not().isEmpty().trim().withMessage('Country is required'),

];
