const router = require('express').Router();
const { couponValidations } = require('../middlewares/validations/couponValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')

const coupon = require('../controllers/coupon');

router.get('/get-coupon', coupon.getAllCoupons);
router.get('/get-discount', [verifyAccessToken, isAdmin], coupon.getAllDiscounts);
router.get('/get-id/:_cid', [verifyAccessToken], coupon.getCouponById);
router.get('/get-coupons', [verifyAccessToken, isAdmin], coupon.getCoupons);
router.put('/update/:_cid', [verifyAccessToken, isAdmin], coupon.updateCoupon);
router.delete('/delete/:_cid', [verifyAccessToken, isAdmin], coupon.deleteCoupon);
router.post('/create', [couponValidations, validate, verifyAccessToken, isAdmin], coupon.createCoupon);


module.exports = router;