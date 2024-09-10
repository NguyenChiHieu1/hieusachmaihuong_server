const router = require('express').Router();
const { couponValidations } = require('../middlewares/validations/couponValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken, isAdmin, isEmployee } = require('../middlewares/authenService')
const uploadCloud = require('../config/uploadImage')
const coupon = require('../controllers/coupon');

router.get('/get-coupon', coupon.getAllCoupons);
router.get('/get-discount', [verifyAccessToken, isEmployee], coupon.getAllDiscounts);
router.get('/get-id/:_cid', [verifyAccessToken], coupon.getCouponById);
router.get('/get-coupons', [verifyAccessToken, isEmployee], coupon.getCoupons);
router.put('/update/:_cid', [verifyAccessToken, isEmployee], uploadCloud.single('image'), coupon.updateCoupon);
router.post('/create', [verifyAccessToken, isEmployee], uploadCloud.single('image'), coupon.createCoupon);
router.delete('/delete/:_cid', [verifyAccessToken, isEmployee], coupon.deleteCoupon);


module.exports = router;