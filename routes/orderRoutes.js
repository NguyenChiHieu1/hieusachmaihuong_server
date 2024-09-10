const router = require('express').Router();
const { verifyAccessToken, isAdmin, isEmployee, isShipper } = require('../middlewares/authenService');
const order = require('../controllers/order');
const { orderValidations } = require('../middlewares/validations/orderValidations');
const { validate } = require('../middlewares/validations/validate')


// Routes for orders
router.post('/create', [orderValidations, validate, verifyAccessToken], order.createOrder);
router.get('/get-order', [verifyAccessToken, isEmployee], order.getOrders);
router.get('/find-order-bill', [verifyAccessToken, isEmployee], order.findOrder);
router.get('/detail/:oid', [verifyAccessToken], order.getOrdersByAdminId);
router.get('/userOrder', verifyAccessToken, order.getOrdersByUserId);
router.put('/user-received/:oid', verifyAccessToken, order.userAuthenReceived);
router.put('/:oid/ratings/:pid', verifyAccessToken, order.updateRatings);
router.put('/cancel-order/:oid', verifyAccessToken, order.userCancelOrder);
router.post('/api-save', [verifyAccessToken, isEmployee], order.apiSave);
router.put('/:oid', [verifyAccessToken, isEmployee], order.updateOrderAdmnin);
router.put('/shipper/:oid', [verifyAccessToken, isEmployee], order.updateOrderShipper);
router.delete('/:oid', [verifyAccessToken, isEmployee], order.deleteOrder);

module.exports = router;