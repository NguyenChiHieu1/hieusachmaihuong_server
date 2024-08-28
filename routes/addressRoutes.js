const router = require('express').Router();
const { addressValidations } = require('../middlewares/validations/addressValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')

const address = require('../controllers/address');

router.get('/', [verifyAccessToken], address.getAllAddresses);
router.get('/get-id/:id', [verifyAccessToken], address.getAddressById);
router.put('/update/:id', [verifyAccessToken, isAdmin], address.updateAddress);
router.delete('/delete/:id', [verifyAccessToken, isAdmin], address.deleteAddress);
router.post('/create', [addressValidations, validate, verifyAccessToken], address.createAddress);


module.exports = router;