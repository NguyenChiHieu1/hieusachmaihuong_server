const { body } = require("express-validator");
module.exports.registerValidations = [
    body('name').not().isEmpty().trim().escape().withMessage('Vui lòng nhập tên tai khoản'),
    body('fullName').not().isEmpty().trim().escape().withMessage('Vui lòng nhập họ và tên'),
    body('email').isEmail().normalizeEmail().trim().escape().withMessage('Vui lòng nhập email'),
    body('password').isLength({ min: 5 }).withMessage('Mật khẩu ít nhất 5 ký tự')
]

module.exports.loginValidations = [
    body('email')
        .isEmail().normalizeEmail().trim().escape()
        .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
        .withMessage('Vui lòng nhập đúng định dạng tài khoản email'),
    body('password')
        .not().isEmpty()
        .isLength({ min: 5 })
        .withMessage('Mật khẩu ít nhất 5 ký tự')
]