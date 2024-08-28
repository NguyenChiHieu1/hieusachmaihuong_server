const router = require('express').Router();
const product = require('../controllers/product')
const { productValidations } = require('../middlewares/validations/productValidations')
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const { validate } = require('../middlewares/validations/validate')
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/', product.getAllProduct)
router.get('/oneproduct/:pid', product.getProductId)
router.post('/save', product.apiSave)
router.get('/get-products', product.getProducts)
router.get('/get-products-category', product.getProductsByCategory)
router.post('/rating/:pid', [verifyAccessToken], product.addRating)
router.get('/get-name', [verifyAccessToken, isAdmin], product.getProducts)
router.post('/create', upload.array('images', 10), [productValidations, validate, verifyAccessToken, isAdmin], product.createProduct)
router.put('/update/:pid', upload.array('images', 10), [verifyAccessToken, isAdmin], product.updateProduct)
router.delete('/delete/:pid', [verifyAccessToken, isAdmin], product.deleteProduct)

module.exports = router;