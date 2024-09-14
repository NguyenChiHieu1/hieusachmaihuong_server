const express = require('express')
const connect = require('./config/connectDB.js')
const routing = require('./routes/routing.js')
const cookieParser = require('cookie-parser');
const cors = require("cors");
require('dotenv').config()
require('./utils/cronJobs.js');

const app = express()


app.use(cookieParser());
app.use(cors({
    origin: 'https://doancuoikhoa.onrender.com'
}));
const port = process.env.PORT || 5000
connect()

app.post(
    "/api/payment/webhook",
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        },
    })
);
app.use(express.json())

app.get("/", (req, res) => {
    res.json({ msg: "Welcome to Hiệu sách Mai Hương" });
});

routing(app);
app.listen(port, () => {
    console.log(`Server is running on url: http://localhost:${port}`);
})
// app.use("/api",userRoute)