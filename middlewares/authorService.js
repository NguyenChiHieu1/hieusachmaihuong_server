const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const hashedPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
}

const comparePassword = async (password, dbPassword) => {
    return await bcrypt.compare(password, dbPassword);
}

const generateAccessToken = (uid, role) => {
    return jwt.sign({ _id: uid, role }, process.env.JWT_SECRET, { expiresIn: '2d' })
}

const generateRefreshToken = (uid) => jwt.sign({ _id: uid }, process.env.JWT_SECRET, { expiresIn: '7d' })


module.exports = {
    hashedPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken
}