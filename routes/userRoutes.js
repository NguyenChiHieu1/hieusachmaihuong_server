const router = require('express').Router();
const user = require('../controllers/user')
const { registerValidations, loginValidations } = require('../middlewares/validations/userValidations')
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const { validate } = require('../middlewares/validations/validate')
const uploadCloud = require('../config/uploadImage')

router.post('/forgot-password', user.forgotPassword)
router.put('/reset-password/:resetCode', user.resetPassword)
router.post('/register', registerValidations, validate, user.register)
router.post('/login', loginValidations, validate, user.login)
router.put('/update', [verifyAccessToken], uploadCloud.single('image'), user.updateUser)
router.post('/logout', [verifyAccessToken], user.logout)
router.post('/wishlist', [verifyAccessToken], user.wishlist)
router.get('/get-info-login', [verifyAccessToken], user.getInfoUserLogin)
router.get('/refresh-token', [verifyAccessToken], user.refreshAccessToken)
router.get('/', [verifyAccessToken, isAdmin], user.getUser)
router.delete('/delete', [verifyAccessToken, isAdmin], user.deleteUser)


module.exports = router;