const cron = require('node-cron');
const slider = require('../models/slider'); // Đảm bảo đường dẫn đúng
const coupons = require('../models/coupons');

// Cron job chạy hàng ngày vào lúc 00:00
cron.schedule('0 0 * * *', async () => {
    try {
        // Cập nhật các slider đã hết hạn
        await slider.updateMany(
            { endDate: { $lt: new Date() }, status: true },
            { $set: { status: false } }
        );
        await coupons.updateMany(
            { endDate: { $lt: new Date() }, status: true },
            { $set: { status: false } }
        );
        console.log('Sliders updated successfully');
    } catch (error) {
        console.error('Error updating sliders:', error);
    }
});