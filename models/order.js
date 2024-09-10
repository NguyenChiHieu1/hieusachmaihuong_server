const mongoose = require("mongoose"); // Erase if already required
const Bill = require("../models/bill");

// Declare the Schema of the Mongo model
const orderSchema = new mongoose.Schema({
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        name: {
            type: String, required: true
        },
        quantity: {
            type: Number, required: true, min: 0,
        },
        price: {
            type: Number, required: true, min: 0,
        },
        discount: {
            type: Number, required: true, min: 0,
        },
        color: {
            type: String, required: true
        },
        ratings: {
            type: Boolean,
            default: false
        }
    }],
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'COD'],
        required: true
    },
    shippingAddress: {
        recipientName: { type: String },
        recipientNumber: { type: Number },
        city: { type: String, required: true },
        country: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        postal_code: { type: String },
        state: { type: String },
    },
    orderStatus: {
        type: String,
        // enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveryDate: {
        type: Date,
    },
    received: {
        type: Boolean,
        default: false
    },
    receivedDay: {
        type: Date,
    },
    notes: {
        type: String,
        default: ""
    },
    idOrder: {
        type: String,
        unique: true
    }
}, { timestamps: true });
// orderSchema.pre('save', function (next) {
//     if (this.isNew || this.isModified('items')) {
//         this.items.forEach((item) => {
//             if (item.ratings === undefined) {
//                 item.ratings = false; 
//             }
//         });
//     }
//     next();
// });
orderSchema.pre('save', async function (next) {
    const order = this;

    // Kiểm tra nếu idOrder đã tồn tại, không cần tạo lại
    if (!order.isNew || order.idOrder) {
        return next();
    }

    try {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = String(currentDate.getFullYear()).slice(2); // Lấy 2 số cuối của năm

        // Tạo 3 số ngẫu nhiên từ 000 đến 999
        const randomNumber = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

        // Tạo idOrder với format DHddmmyy+randomNumber
        order.idOrder = `DH${day}${month}${year}${randomNumber}`;

        next(); // Tiếp tục lưu document
    } catch (error) {
        next(error);
    }
});
// orderSchema.post('save', async function (doc, next) {
//     try {
//         const existingBill = await Bill.findOne({ order: doc._id });
//         if (!existingBill) {
//             const newBill = new Bill({
//                 order: doc._id,
//                 amountDue: doc.totalAmount,
//                 paymentMethod: doc.paymentMethod,
//                 paymentStatus: 'pending',
//                 billAddress: doc.shippingAddress,
//                 notes: doc.notes
//             });
//             await newBill.save();
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// Export the model
module.exports = mongoose.model('Order', orderSchema);
