const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt')

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/dr3f3acgx/image/upload/v1724351609/duxt59vn98gdxqcllctt.jpg"
    },
    phoneNumber: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'employee', 'shipper'],
        default: 'user'
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    }],
    wishlist: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Product'
        }
    ],
    refreshToken: {
        type: String,
    },
    passwordChangeAt: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    isBlock: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Boolean,
        // enum: ['online', 'offline'],
        default: false,
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    const salt = bcrypt.genSaltSync(10)
    this.password = await bcrypt.hash(this.password, salt)
})
//Export the model
module.exports = mongoose.model('User', userSchema);