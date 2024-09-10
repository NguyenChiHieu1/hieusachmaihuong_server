const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

const verifyAccessToken = asyncHandler(async (req, res, next) => {
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err) return res.status(401).json({
                success: false,
                message: 'Invalid access token'
            })
            req.info_user = decode
            next()
        })
    } else {
        return res.status(401).json({
            success: false,
            message: 'Require authentication!!!'
        })
    }
});

const isAdmin = asyncHandler(async (req, res, next) => {
    const { role } = req.info_user
    if (role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: 'Require admin role!!!'
        })
    }
    next()
})


const isEmployee = asyncHandler(async (req, res, next) => {
    const { role } = req.info_user;
    if (role !== 'employee' && role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require employee role!!!'
        });
    }
    next();
});

const isShipper = asyncHandler(async (req, res, next) => {
    const { role } = req.info_user;
    if (role !== 'shipper' && role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require employee role!!!'
        });
    }
    next();
});

module.exports = { verifyAccessToken, isAdmin, isEmployee, isShipper }