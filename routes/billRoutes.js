const router = require('express').Router();
const { verifyAccessToken, isAdmin, isEmployee } = require('../middlewares/authenService');
const bill = require('../controllers/bill');
// const { billValidations } = require('../middlewares/validations/billValidations');
const { validate } = require('../middlewares/validations/validate');

// Routes for bills
router.post('/create', [validate, verifyAccessToken], bill.createBill);
router.get('/detail/:oid', [verifyAccessToken], bill.getBillById);
router.get('/get-bills', [verifyAccessToken, isEmployee], bill.getBills);
router.put('/:oid', [verifyAccessToken, isEmployee], bill.updateBill);
router.delete('/:bid', [verifyAccessToken, isEmployee], bill.deleteBill);
router.post('/save', [verifyAccessToken, isEmployee], bill.apiSave);

module.exports = router;
