const express = require('express');
const router = express.Router();
const { addItemToCartValidations } = require('../middlewares/validations/cartValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken } = require('../middlewares/authenService')
const cart = require('../controllers/cart');

router.post('/create', [addItemToCartValidations, validate, verifyAccessToken], cart.addItemToCart);
router.get('/', [verifyAccessToken], cart.getCartByUserId);
router.delete('/delete-item', [verifyAccessToken], cart.removeItemFromCart);
router.delete('/delete-cart', [verifyAccessToken], cart.deleteCart);

module.exports = router;
