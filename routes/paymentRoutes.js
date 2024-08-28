const express = require("express");
const router = require('express').Router();
const payment = require('../controllers/payment');
const { verifyAccessToken } = require('../middlewares/authenService');

router.post("/create-checkout-session", [verifyAccessToken], payment.paymentProcess);
router.post("/webhook", express.raw({ type: "application/json" }), payment.checkOutSession);
router.get("/payment-verify/:id", [verifyAccessToken], payment.paymentVerify);


module.exports = router;