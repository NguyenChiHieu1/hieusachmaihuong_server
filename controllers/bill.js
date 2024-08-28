const Bill = require('../models/bill'); // Model Bill
const Order = require('../models/order'); // Model Order
const asyncHandler = require('express-async-handler');

// Tạo hóa đơn mới sau khi đơn hàng được tạo
const createBill = asyncHandler(async (req, res) => {
    const { orderId, amountDue, paymentMethod, billAddress, notes } = req.body;

    try {
        // Kiểm tra xem đơn hàng có tồn tại hay không
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        const billCreate = await Bill.create({
            order: orderId,
            amountDue,
            paymentMethod,
            billAddress,
            notes
        });

        res.status(201).json({
            success: true,
            data: billCreate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Create bill failed!",
            error: error.message
        });
    }
});

// Lấy tất cả hóa đơn (Chỉ dành cho admin)
const getBills = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);

    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formatedQueries = JSON.parse(queryString);

    if (queries?.paymentStatus) {
        formatedQueries.paymentStatus = queries.paymentStatus;
    }

    let queryCommand = Bill.find(formatedQueries).populate({
        path: 'order',
        select: 'items customer'
    }).populate({
        path: 'order.customer',
        select: 'name email'
    });

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort('-createdAt');
    }

    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_BILLS;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {
        const bills = await queryCommand.exec();
        const counts = await Bill.find(formatedQueries).countDocuments();
        return res.status(200).json({
            success: true,
            data: bills,
            counts: counts,
            currentPage: page,
            totalPage: Math.ceil(counts / limit)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get bills',
            error: err.message
        });
    }
});

// Lấy hóa đơn theo order ID (Admin hoặc người dùng)
const getBillById = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const bill = await Bill.findOne({ order: oid })
        .populate('order', 'items orderStatus received')
        .populate({
            path: 'order.customer',
            select: 'name email phoneNumber address'
        });
    if (!bill) {
        return res.status(404).json({ msg: 'Bill not found' });
    }
    res.status(200).json({
        success: true,
        data: bill,
    });
});

// Cập nhật hóa đơn (chỉ Admin)
const updateBill = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    const { paymentStatus, paymentDate, billAddress, notes } = req.body;

    try {
        const bill = await Bill.findById(bid);
        if (!bill) {
            return res.status(404).json({ msg: 'Bill not found' });
        }

        if (paymentStatus) {
            bill.paymentStatus = paymentStatus;
        }

        if (paymentDate) {
            bill.paymentDate = paymentDate;
        }

        if (billAddress) {
            bill.billAddress = { ...bill.billAddress, ...billAddress };
        }

        if (notes) {
            bill.notes = notes;
        }

        const updatedBill = await bill.save();
        res.status(200).json({
            success: true,
            data: updatedBill,
            msg: 'Bill updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error updating bill',
            error: error.message
        });
    }
});

// Xóa hóa đơn
const deleteBill = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    try {
        const bill = await Bill.findByIdAndDelete(bid);
        if (!bill) {
            return res.status(404).json({ msg: 'Bill not found' });
        }
        res.status(200).json({
            success: true,
            msg: 'Bill deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error deleting bill',
            error: error.message
        });
    }
});

module.exports = {
    createBill,
    getBills,
    getBillById,
    updateBill,
    deleteBill,
};
