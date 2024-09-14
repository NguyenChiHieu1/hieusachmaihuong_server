const { now } = require('mongoose');
const Bill = require('../models/bill'); // Model Bill
const Order = require('../models/order'); // Model Order
const asyncHandler = require('express-async-handler');

// Tạo hóa đơn mới sau khi đơn hàng được tạo
const createBill = asyncHandler(async (req, res) => {
    const { order, amountDue, paymentMethod, billAddress, notes, paymentStatus } = req.body;

    try {
        // Kiểm tra xem đơn hàng có tồn tại hay không
        // console.log(req.body)
        const orderFind = await Order.findOne({ _id: order });
        // console.log(orderFind)

        if (!orderFind) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        const billCreate = await Bill.create({
            order: order,
            amountDue,
            paymentMethod,
            billAddress,
            paymentStatus,
            notes,
            idOrder: orderFind.idOrder
        });
        if (paymentMethod === "bank_transfer") {
            const billUpdate = await Bill.updateOne({ _id: billCreate._id }, {
                paymentDate: new Date()
            })
        }
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
        select: 'customer orderStatus'
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
        }).select("");
    if (!bill) {
        return res.status(404).json({ msg: 'Bill not found' });
    }
    res.status(200).json({
        success: true,
        data: bill,
    });
});

// Cập nhật hóa đơn-quanly-update trang thai
const updateBill = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { paymentStatus, isRefund, paymentDate } = req.body;

    try {
        let bill = await Bill.findOne({ order: oid });
        if (!bill) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        //quan ly xac nhan trang thai
        if (paymentStatus) {
            if (paymentStatus === "paid") {
                bill.paymentDate = new Date();
            }
            bill.paymentStatus = paymentStatus;
        }
        //admin xac nhan da hoan tra
        if (isRefund && bill.paymentStatus === "refund") {
            bill.isRefund = isRefund
        }
        //admin update
        if (paymentDate) {
            bill.paymentDate = paymentDate;
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
const apiSave = asyncHandler(async (req, res) => {
    try {
        const bills = await Bill.find().populate("order", "idOrder").select("order");

        // Tạo danh sách các promise để lưu các tài liệu Bill
        const savePromises = bills.map(async (bill) => {
            bill.idOrder = bill.order.idOrder;
            return bill.save(); // Trả về promise để xử lý đồng bộ
            return null; // Không cần lưu nếu không có idOrder
        }).filter(Boolean); // Lọc bỏ các giá trị null

        // Đợi tất cả các tài liệu được lưu hoàn tất
        await Promise.all(savePromises);
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: error.message
        });
    }
})
module.exports = {
    createBill,
    getBills,
    getBillById,
    updateBill,
    deleteBill,
    apiSave
};
