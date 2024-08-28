const mongoose = require("mongoose")
const connect = async () => {
    try {
        const conn = await mongoose.connect(`mongodb+srv://chihieunc99:${process.env.PASSWORD}@cluster0.v0vp5ub.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
            //khi kết đến máy chủ MongoSB trong khoảng 5s thì báo lỗi
            { serverSelectionTimeoutMS: 5000 });
        console.log("Database connection successfully");
    } catch (error) {
        throw new Error(error.message)
    }
}
module.exports = connect;