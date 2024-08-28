const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    //đường dẫn đến sp: tạo từ tên sp, bỏ dấu vd: áo polo: ao_polo
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
    },
    color: [{
        type: String
    }],
    sizes: [{
        type: String,
    }],
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    sold: {  // Thêm thuộc tính này
        type: Number,
        default: 0,
        min: [0, 'Số lượng đã bán không thể âm'],
    },
    coupons: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupons',
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    images: {
        type: Array,
        default: [],
    },
    status: {
        type: String,
        enum: ['available', 'out_of_stock', 'discontinued'],
        default: 'available',
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
    },
    ratings: [
        {
            star: { type: Number, min: 1, max: 5 },
            postedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
            comment: { type: String }
        }
    ],
    totalRatings: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
    },
    money: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

productSchema.pre('save', async function (next) {
    if (this.coupons && this.price) {
        const coupon = await mongoose.model('Coupons').findById(this.coupons);
        const discount = coupon ? coupon.discount : 0;
        this.money = this.price * (1 - discount / 100);
    } else {
        this.money = this.price;
    }
    next();
});

// Export the model
module.exports = mongoose.model('Product', productSchema);
