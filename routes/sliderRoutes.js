const router = require('express').Router();
const { sliderValidations } = require('../middlewares/validations/sliderValidations');
const { validate } = require('../middlewares/validations/validate');
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const uploadCloud = require("../config/uploadImage")
const slider = require('../controllers/slider');

router.get('/', [verifyAccessToken], slider.getAllSliders);
router.get('/get-id/:id', [verifyAccessToken], slider.getSliderById);
router.put('/update/:id', [verifyAccessToken, isAdmin], uploadCloud.single('image'), slider.updateSlider);
router.delete('/delete/:id', [verifyAccessToken, isAdmin], slider.deleteSlider);
router.post('/create', uploadCloud.single('image'), [sliderValidations, validate, verifyAccessToken, isAdmin], slider.createSlider);
router.post('/upload-image', [verifyAccessToken, isAdmin], uploadCloud.single('image'), slider.uploadImage);


module.exports = router;