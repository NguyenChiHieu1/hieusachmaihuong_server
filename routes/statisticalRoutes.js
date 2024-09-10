const router = require('express').Router();
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const statistical = require('../controllers/statistical');

router.get('/product-data', [verifyAccessToken, isAdmin], statistical.getProductsData);
router.get('/revenue-by-time', [verifyAccessToken, isAdmin], statistical.getRevenueByTime);
router.get('/order-by-status', [verifyAccessToken, isAdmin], statistical.getOrderCountByStatus);
router.get('/payment-method', [verifyAccessToken, isAdmin], statistical.getRevenueByPaymentMethod);
router.get('/order-count-time', [verifyAccessToken, isAdmin], statistical.getOrderCountByTime);
router.get('/revenue-by-product', [verifyAccessToken, isAdmin], statistical.getRevenueByProduct);

module.exports = router;