const nodemailer = require("nodemailer");
const asyncHandler = require('express-async-handler')

const sendMail = asyncHandler(async ({ email, html }) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_NAME,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"Hiệu sách Mai Hương" <chihieunc1999@gmail.com>',
        to: email,
        subject: "Forgot password",
        text: "Để cấp lại mật khẩu bạn vui lòng ấn Link ở dưới đây!",
        html: html
    });

    return info
})

module.exports = sendMail;