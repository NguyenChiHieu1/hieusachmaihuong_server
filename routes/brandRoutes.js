const express = require('express');
const router = express.Router();
const { brandValidations } = require('../middlewares/validations/brandValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const brand = require('../controllers/brand');
router.get('/get-brand', [verifyAccessToken, isAdmin], brand.getBrands);
router.get('/', [verifyAccessToken], brand.getAllBrands);
router.get('/:id', [verifyAccessToken], brand.getBrandById);
router.post('/create', [brandValidations, validate, verifyAccessToken, isAdmin], brand.createBrand);

router.put('/update/:id', [brandValidations, validate, verifyAccessToken, isAdmin], brand.updateBrand);
router.delete('/delete/:id', [verifyAccessToken, isAdmin], brand.deleteBrand);

module.exports = router;
