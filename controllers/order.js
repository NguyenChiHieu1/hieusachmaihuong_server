const Order = require('../models/order');
const Product = require('../models/product');
const Bill = require('../models/bill');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// Tạo đơn hàng mới
const createOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { _id } = req.info_user;
    const { customer } = req.body
    try {
        // Tạo đơn hàng
        const orderCreate = await Order.create({
            ...req.body,
            customer: customer ? customer : _id
        });

        // Cập nhật số lượng và trạng thái hàng hóa mua
        let cartArray = orderCreate.items;
        for (const item of cartArray) {
            const product = await Product.findById(item.productId);
            if (product) {
                let stock = product.stock - item.quantity;
                stock = stock < 0 ? 0 : stock;

                let status = "available";
                if (stock === 0) {
                    status = "out_of_stock";
                }

                await Product.findByIdAndUpdate(product._id, {
                    stock: stock,
                    status: status,
                    sold: product.sold + item.quantity,
                }, { new: true });
            }
        }

        res.status(201).json({
            success: true,
            data: orderCreate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Create order failed!",
            error: error.message
        });
    }
});

// Lấy tất cả đơn hàng (Chỉ dành cho admin)
const getOrders = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(field => delete queries[field]);

    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const formatedQueries = JSON.parse(queryString);

    // Nếu có yêu cầu lọc theo trạng thái đơn hàng
    if (queries?.orderStatus) {
        formatedQueries.orderStatus = queries.orderStatus;
    }

    // Tạo truy vấn
    let queryCommand = Order.find(formatedQueries).populate({
        path: 'customer',
        select: 'email fullName'
    }).populate({
        path: 'items.productId',
        select: 'name price'
    });

    // Sắp xếp kết quả
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort('-createdAt');
    }

    // Giới hạn các trường dữ liệu
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Phân trang
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_ORDERS;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    try {
        const orders = await queryCommand.exec();
        const counts = await Order.find(formatedQueries).countDocuments();
        return res.status(200).json({
            success: true,
            data: orders,
            counts: counts,
            currentPage: page,
            totalPage: Math.ceil(counts / limit)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get orders',
            error: err.message
        });
    }
});

//dung bên bill 
const findOrder = asyncHandler(async (req, res) => {
    try {
        const ordersWithoutBill = await Order.find().select("-receivedDay -received -items").populate("customer", "fullName");
        const ordersWithoutInvoice = [];

        // Duyệt qua từng order để kiểm tra xem nó có bill hay không
        for (let order of ordersWithoutBill) {
            const existingBill = await Bill.findOne({ order: order._id }).exec();
            if (!existingBill) {
                ordersWithoutInvoice.push(order);
            }
        }
        return res.status(200).json({
            success: true,
            data: ordersWithoutInvoice
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: 'Cannot get orders',
            error: err.message
        })
    }
})
// Xem chi tiết đơn hàng của admmin theo ID 
const getOrdersByAdminId = asyncHandler(async (req, res) => {
    const { oid } = req.params
    const orders = await Order.findById(oid)
        .populate('items.productId', 'images')
        .populate({
            path: "customer",
            select: "fullName email phoneNumber address"
        })
    if (!orders) {
        return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(200).json({
        success: true,
        data: orders,
    });
});

// Lấy đơn hàng theo ID người dùng
const getOrdersByUserId = asyncHandler(async (req, res) => {
    const { _id } = req.info_user
    const orders = await Order.find({ customer: _id })
        .sort({ createdAt: -1 })
        .populate('items.productId', 'images');
    if (!orders) {
        return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(200).json({
        success: true,
        data: orders,
    });
});

// Cập nhật đơn hàng đã nhận hàng cho khách hàng
//Trường hợp: COD thì xác thực nhận: còn shipper sẽ xác nhận thanh toán tiền bên bill
//Trương hợp trans_bank thì nhân viên sẽ xác nhận với các đơn thanh toán bằng bank

const userAuthenReceived = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { _id } = req.info_user
    try {
        // Tìm đơn hàng theo ID
        const order = await Order.findOne({ _id: oid, customer: _id });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        order.received = true;
        order.receivedDay = new Date();
        const updatedOrder = await order.save();
        res.status(200).json({
            success: true,
            msg: "Recives Successful "
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        res.status(500).json({
            success: false,
            msg: 'Error updating order',
            error: error.message
        });
    }
});

const updateRatings = asyncHandler(async (req, res) => {
    const { oid, pid } = req.params;
    const { _id } = req.info_user;
    try {
        // Tìm đơn hàng theo ID và người dùng
        const order = await Order.findOne({ _id: oid, customer: _id });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Tìm sản phẩm trong đơn hàng
        let itemPro = order.items.find((it) => it.productId.toString() === pid);
        if (!itemPro) {
            return res.status(400).json({
                success: false,
                msg: "Not found product in order"
            });
        }

        // Cập nhật trường ratings cho sản phẩm
        itemPro.ratings = true;
        await order.save();

        res.status(200).json({
            success: true,
            msg: "Ratings updated successfully"
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        res.status(500).json({
            success: false,
            msg: 'Error updating order',
            error: error.message
        });
    }
});

//Hủy đơn hàng
const userCancelOrder = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { _id } = req.info_user;

    try {
        // Tìm đơn hàng theo ID và khách hàng
        const order = await Order.findOne({ _id: oid, customer: _id });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Cập nhật số lượng sản phẩm
        let cartArray = order.items;
        for (const item of cartArray) {
            const product = await Product.findById(item.productId);
            if (product) {
                // Tăng lại số lượng sản phẩm trong kho
                let updatedStock = product.stock + item.quantity;
                let status = "available";

                // Cập nhật trạng thái sản phẩm
                if (updatedStock === 0) {
                    status = "out_of_stock";
                }
                let sold_number = product.sold - item.quantity;
                if (sold_number < 0) sold_number = 0;
                await Product.findByIdAndUpdate(product._id, {
                    stock: updatedStock,
                    status: status,
                    sold: sold_number,
                }, { new: true });
            }
        }

        // Cập nhật trạng thái đơn hàng thành "canceled"
        order.orderStatus = "cancelled";
        order.receivedDay = new Date();
        const updatedOrder = await order.save();

        res.status(200).json({
            success: true,
            msg: "Order canceled successfully",
            updatedOrder,
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        res.status(500).json({
            success: false,
            msg: 'Error canceling order',
            error: error.message,
        });
    }
});



//update đơn hàng của quanli,admin pending -> process
const updateOrderAdmnin = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { orderStatus, shippingAddress, totalAmount, notes, items, customer, deliveryDate } = req.body;

    try {
        // Find the order by ID
        const order = await Order.findById(oid);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        const bill = await Bill.findOne({ order: oid })
        if (!bill) {
            return res.status(404).json({ msg: 'Bill not found' });
        }
        // Update order status if provided
        if (orderStatus) {
            switch (orderStatus) {
                case "delivered":
                    order.deliveryDate = new Date();
                    bill.paymentStatus = "paid";
                    if (order.paymentMethod === "COD") {
                        bill.paymentDate = new Date();
                    }
                    break;
                case "canceller":
                    // bill.paymentStatus = "paid";
                    // await bill.save();
                    break;
                default:
                    break;
            }
            order.orderStatus = orderStatus;
        }

        // Update shipping address if provided
        if (shippingAddress) {
            order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
            bill.billAddress = { ...bill.billAddress, ...shippingAddress };
        }
        if (totalAmount) {
            order.totalAmount = totalAmount;
            bill.amountDue = totalAmount;
        }
        if (deliveryDate) {
            order.deliveryDate = deliveryDate;
        }
        if (notes) {
            order.notes = notes;
            bill.notes = notes;
        }

        order.items = items ? items : order.items;
        order.customer = customer ? customer : order.customer;
        await bill.save();
        const updatedOrder = await order.save();
        // Phản hồi thành công
        res.status(200).json({
            success: true,
            msg: "Update successfull!!"
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        res.status(500).json({
            success: false,
            msg: 'Error updating order',
            error: error.message
        });
    }
});

//update đơn hàng của shipper
const updateOrderShipper = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { status } = req.body;
    const validStatuses = ['shipped', 'delivered'];
    try {
        // Tìm đơn hàng theo ID
        const order = await Order.findById(oid);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        const bill = await Bill.findOne({ order: oid })
        if (!bill) {
            return res.status(404).json({ msg: 'Bill not found' });
        }
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid order status' });
        }
        // Cập nhật trạng thái đơn hàng 
        order.orderStatus = status;
        if (status === 'delivered') {
            // console.log("delivered")
            order.deliveryDate = new Date();
            await order.save();
            // Cap nhật trong hóa đơn
            bill.paymentStatus = "paid";
            if (order.paymentMethod === "COD") {
                bill.paymentDate = new Date();
            }
            await bill.save();
            //
            // Gui thong bao toi khach
        } else {
            await order.save();
        }
        // Phản hồi thành công
        res.status(200).json({
            success: true,
            msg: "Update Successful"
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        res.status(500).json({
            success: false,
            msg: 'Error updating order',
            error: error.message
        });
    }
});

// Xóa đơn hàng
const deleteOrder = asyncHandler(async (req, res) => {
    const { oid } = req.params
    console.log(oid)
    const order = await Order.findByIdAndDelete(oid);
    const deleteBills = await Bill.deleteOne({ order: oid })
    if (!order && !deleteBills) {
        return res.status(404).json({ message: 'Order delete failed!!!' });
    }
    if (deleteBills.deletedCount === 0) {
        return res.status(404).json({ message: 'No associated bill found. Bill deletion failed!' });
    }
    res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
        dataOrder: order,
        dataBill: deleteBills
    });
});

const apiSave = asyncHandler(async (req, res) => {
    try {
        const data = await Order.find();
        // const savePromises = data.map((item) => item.save());
        // Kiểm tra nếu idOrder đã tồn tại, không cần tạo lại
        // const savePromises = data.map((item) => {
        //     if (item.idOrder) return null;
        //     const creAt = new Date(item.createdAt);
        //     const day = String(creAt.getDate()).padStart(2, '0');
        //     const month = String(creAt.getMonth() + 1).padStart(2, '0');
        //     const year = String(creAt.getFullYear()).slice(2); // Lấy 2 số cuối của năm
        //     const randomNumber = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        //     item.idOrder = `DH${day}${month}${year}${randomNumber}`;
        //     return item.save();
        // }).filter(Boolean);
        // await Promise.all(savePromises);

        res.status(200).json({
            success: true,
            msg: 'Data saved successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: error.message
        })
    }
})

module.exports = {
    createOrder,
    getOrders,
    updateRatings,
    getOrdersByUserId,
    userCancelOrder,
    getOrdersByAdminId,
    userAuthenReceived,
    updateOrderAdmnin,
    updateOrderShipper,
    deleteOrder,
    apiSave,
    findOrder
};
