const { body } = require("express-validator");
module.exports.registerValidations = [
    body('name').not().isEmpty().trim().escape().withMessage('name is required'),
    body('fullName').not().isEmpty().trim().escape().withMessage('fullname is required'),
    body('email').isEmail().normalizeEmail().trim().escape().withMessage('email is required'),
    body('password').isLength({ min: 5 }).withMessage('password should be 5 characters long')
]

module.exports.loginValidations = [
    body('email')
        .isEmail().normalizeEmail().trim().escape()
        .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
        .withMessage('Email must be a valid Gmail address'),
    body('password')
        .not().isEmpty()
        .isLength({ min: 5 })
        .withMessage('Password is required and must be at least 5 characters long')
]