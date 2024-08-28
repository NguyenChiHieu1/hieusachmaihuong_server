const router = require('express').Router();
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService');
const order = require('../controllers/order');
const { orderValidations } = require('../middlewares/validations/orderValidations');
const { validate } = require('../middlewares/validations/validate')


// Routes for orders
router.post('/create', [orderValidations, validate, verifyAccessToken], order.createOrder);
router.get('/get-order', [verifyAccessToken, isAdmin], order.getOrders);
router.get('/detail/:oid', [verifyAccessToken], order.getOrdersByAdminId);
router.get('/userOrder', verifyAccessToken, order.getOrdersByUserId);
router.put('/user-received/:oid', verifyAccessToken, order.userAuthenReceived);
router.put('/:oid/ratings/:pid', verifyAccessToken, order.updateRatings);
router.put('/cancel-order/:oid', verifyAccessToken, order.userCancelOrder);
router.post('/api-save', [verifyAccessToken, isAdmin], order.apiSave);
router.put('/:oid', [verifyAccessToken, isAdmin], order.updateOrderAdmnin);
router.put('/shipper/:oid', [verifyAccessToken, isAdmin], order.updateOrderShipper);
router.delete('/:oid', [verifyAccessToken, isAdmin], order.deleteOrder);

module.exports = router;