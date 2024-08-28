const Cart = require('../models/cart')
const User = require('../models/user')
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator')

const addItemToCart = asyncHandler(async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    const { _id } = req.info_user;

    const { product, quantity, color } = req.body;

    let cart = await Cart.findOne({ userId: _id });

    if (!cart) {
        throw new Error("Not found Cart user")
        // const createCart = await Cart.create({
        //     userId: _id,
        //     items: []
        // });
        // if (!createCart) throw new Error('Create cart failed')
        // await User.findByIdAndUpdate(_id, { cart: createCart._id }, { new: true })
        // cart = createCart;
    } else {
        const itemIndex = cart.items.findIndex((item) =>
            item.product.toString() === product.toString() &&
            item.color === color
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product,
                quantity,
                color,
            });
        }
        await cart.save();
    }
    res.status(200).json({ success: true, data: cart });
});

const getCartByUserId = asyncHandler(async (req, res) => {
    const { _id } = req.info_user;
    const cart = await Cart.findOne({ userId: _id })
        .populate({
            path: 'items.product',
            select: 'name price coupons images',
            populate: {
                path: 'coupons',
                select: 'name discount'
            },
        });
    if (!cart) return res.status(404).json({ success: false, msg: "Cart not found" });

    res.status(200).json({ success: true, data: cart });
});

const deleteCart = asyncHandler(async (req, res) => {
    const { _id } = req.info_user;
    const cart = await Cart.findOneAndDelete({ userId: _id });
    if (!cart) return res.status(404).json({ success: false, msg: "Cart not found" });

    res.status(200).json({ success: true, msg: "Cart deleted successfully" });
});

const removeItemFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.info_user;
    const { productId } = req.body;
    const cart = await Cart.findOne({ userId: _id });
    if (!cart) return res.status(404).json({ success: false, msg: "Cart not found" });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    await cart.save();
    res.status(200).json({ success: true, data: cart });
});

module.exports = {
    addItemToCart,
    getCartByUserId,
    deleteCart,
    removeItemFromCart
}