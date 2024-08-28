const router = require('express').Router();
const cate = require('../controllers/category')
const { categoryValidations } = require('../middlewares/validations/categoryValidations')
const { verifyAccessToken, isAdmin } = require('../middlewares/authenService')
const { validate } = require('../middlewares/validations/validate')

router.get('/', cate.getAllCategory)
router.get('/name-cate/:id', cate.getNameCateClient)
// router.get('/cate-child', [verifyAccessToken], cate.getCategoryChild)
router.get('/catelevel12', [verifyAccessToken], cate.getCategoriesLevel1And2)
router.get('/catelevel123', cate.getParent123Category)
router.get('/catelevel3', [verifyAccessToken], cate.getCategoriesLevel3)

router.post('/create', [categoryValidations, validate, verifyAccessToken, isAdmin,], cate.createCategory)
router.put('/update/:cid', [verifyAccessToken, isAdmin], cate.updateCategory)
router.delete('/delete/:cid', [verifyAccessToken, isAdmin], cate.deleteCategory)
router.get('/get-categories', [verifyAccessToken, isAdmin], cate.getCategories)
// router.put('/update', [verifyAccessToken, isAdmin], ctrl.updateCategory)

module.exports = router;