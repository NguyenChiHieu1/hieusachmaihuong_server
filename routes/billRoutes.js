const router = require('express').Router();
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService');
const bill = require('../controllers/bill');
// const { billValidations } = require('../middlewares/validations/billValidations');
const { validate } = require('../middlewares/validations/validate');

// Routes for bills
router.post('/create', [validate, verifyAccessToken], bill.createBill);
router.get('/get-bills', [verifyAccessToken, isAdmin], bill.getBills);
router.get('/detail/:oid', [verifyAccessToken], bill.getBillById);
router.put('/:bid', [verifyAccessToken, isAdmin], bill.updateBill);
router.delete('/:bid', [verifyAccessToken, isAdmin], bill.deleteBill);

module.exports = router;
