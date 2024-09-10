const { notFound, errorHandler } = require('../middlewares/errorHandler')
const userRoutes = require('./userRoutes')
const categoryRoutes = require('./categoryRoutes')
const productRoutes = require('./productRoutes')
const couponRoutes = require('./couponRoutes')
const addressRoutes = require('./addressRoutes')
const sliderRoutes = require('./sliderRoutes')
const brandRoutes = require('./brandRoutes')
const cartRoutes = require('./cartRoutes')
const paymentRoutes = require('./paymentRoutes')
const orderRoutes = require('./orderRoutes')
const billRoutes = require('./billRoutes')
const statisticalRoutes = require('./statisticalRoutes')

const routing = (app) => {
    app.use('/api/user', userRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/address', addressRoutes);
    app.use('/api/slider', sliderRoutes);
    app.use('/api/brand', brandRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/order', orderRoutes);
    app.use('/api/bill', billRoutes);
    app.use('/api/statistical', statisticalRoutes);

    app.use(notFound);
    app.use(errorHandler);
};

module.exports = routing;