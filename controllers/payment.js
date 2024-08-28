const stripe = require("stripe")(process.env.STRIPE_KEY);
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const asyncHandler = require('express-async-handler')

function orderConvertData(cart, data, success, notes) {
    let objectData = {
        items: [],
        customer: '',
        totalAmount: 0,
        paymentMethod: '',
        shippingAddress: {
            recipientName: '',
            recipientNumber: 0,
            city: '',
            country: '',
            line1: '',
            line2: '',
            postal_code: '',
            state: " "
        },
        orderStatus: '',
        notes: ''
    };

    cart.forEach((item) => {
        if (item._id && item.name && item.color) {
            objectData.items.push({
                productId: item._id || '',
                name: item.name || '',
                quantity: item.quantity || 0,
                price: item.price || 0,
                discount: item.discount || 0,
                color: item.color || ''
            });
        } else {
            // Handle missing required fields here if necessary
            console.error('Cart item missing required fields:', item);
        }
    });
    objectData.customer = cart[0].userId || '';
    objectData.totalAmount = data.amount_total || 0;
    objectData.paymentMethod = data.payment_method_types[0] || '';
    objectData.shippingAddress.recipientName = data.customer_details.name || '';
    objectData.shippingAddress.recipientNumber = data.customer_details.phone || 0;
    objectData.shippingAddress.city = data.customer_details.address.city || '';
    objectData.shippingAddress.country = data.customer_details.address.country || '';
    objectData.shippingAddress.line1 = data.customer_details.address.line1 || '';
    objectData.shippingAddress.line2 = data.customer_details.address.line2 || '';
    objectData.shippingAddress.postal_code = data.customer_details.address.postal_code || '';
    objectData.shippingAddress.state = data.customer_details.address.state || '';
    success ? (objectData.orderStatus = 'processing') : (objectData.orderStatus = 'pending');
    notes && (objectData.notes = notes);
    return objectData;
}

const paymentProcess = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    const _id = req.info_user
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({
        success: false,
        msg: "User not found!!!"
    })

    const orderData = cart.map((item) => {
        let discountPro = item.discount || 0;
        if (item.coupon) {
            discountPro = Math.max(discountPro, item.coupon);
        }
        return {
            _id: item._id,
            name: item.name,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            discount: discountPro,
            userId: user._id,
        };
    });

    const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
            cart: JSON.stringify(orderData),
        },
    });

    const session = await stripe.checkout.sessions.create({
        shipping_address_collection: {
            allowed_countries: ["VN"],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: 0,
                        currency: "VND",
                    },
                    display_name: "Free shipping",
                    delivery_estimate: {
                        minimum: {
                            unit: "business_day",
                            value: 2,
                        },
                        maximum: {
                            unit: "business_day",
                            value: 3,
                        },
                    },
                },
            },
        ],
        line_items: cart.map((item) => {
            let actualPrice = 0;
            let discount = item.discount || 0;
            if (item.coupon) {
                discount = Math.max(discount, item.coupon);
            }
            actualPrice = item.price - item.price * (discount / 100);
            actualPrice = Math.round(actualPrice);
            return {
                price_data: {
                    currency: "VND",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: actualPrice,
                },
                quantity: item.quantity,
            };
        }),
        customer: customer.id,
        mode: "payment",
        success_url: `${process.env.CLIENT}/order-detail?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT}/cart`,
        phone_number_collection: {
            enabled: true, // Bật thu thập số điện thoại
        },
    });
    res.json({ url: session.url });
});

const checkOutSession = asyncHandler(async (request, response) => {
    const sig = request.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            request.rawBody,
            sig,
            process.env.ENDPOINTSECRET
        );
        console.log("payment success");
    } catch (err) {
        console.log(err.message);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            console.log("Payment succeeded");
            break;

        case "payment_intent.payment_failed":
            const failedIntent = event.data.object;
            let notes = failedIntent.last_payment_error?.message;
            // console.log("Payment failed:", failedIntent.last_payment_error?.message);

            let info = await stripe.customers.retrieve(failedIntent.customer);
            console.log("customer_failed", info);
            let infoFailedCart = JSON.parse(info?.metadata?.cart);
            console.log("infoFailed", infoFailed);

            try {
                const objectFailed = orderConvertData(infoFailedCart, failedIntent, false, notes)
                await Order.create(objectFailed);
            } catch (error) {
                console.log("Failed to save failed order:", error.message);
            }

            response.status(400).send({
                error: "Payment failed",
                message: failedIntent.last_payment_error?.message,
            });
            return;

        case "checkout.session.completed":
            const data = event.data.object;
            console.log("data", data);
            let customer = await stripe.customers.retrieve(data.customer);
            console.log("customer", customer);
            let cartItems = JSON.parse(customer?.metadata?.cart);

            try {
                // let note = "";
                const orderItem = orderConvertData(cartItems, data, true, null);
                const newOrder = await Order.create(orderItem);
                console.log("newOrder", orderItem);
                // Update product stock
                for (const item of cartItems) {
                    const product = await Product.findOne({ _id: item._id });
                    if (product) {
                        let stock = product.stock - item.quantity;
                        stock = stock < 0 ? 0 : stock;
                        let status = "available";
                        if (stock === 0) {
                            status = "out of stock";
                        }
                        await Product.findByIdAndUpdate(item._id, {
                            stock: stock,
                            status: status,
                            sold: item.quantity,
                        }, { new: true });
                    }
                }

                console.log("Order created successfully:", newOrder._id);
            } catch (error) {
                console.log("Failed to create order:", error.message);
                return response.status(500).json("Server internal error");
            }
            break;

        case "customer.created":

            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
})

const paymentVerify = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const session = await stripe.checkout.sessions.retrieve(id);
        return res.status(200).json({
            msg: "Your payment has verfied successfully",
            status: session.payment_status,
        });
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

module.exports = {
    paymentProcess,
    checkOutSession,
    paymentVerify
}