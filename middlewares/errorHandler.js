//Mục Đích: Middleware này được sử dụng để xử lý các yêu cầu đến các route không được định nghĩa trong ứng dụng của bạn.
//  Nó sẽ gửi một lỗi 404 khi người dùng cố gắng truy cập vào một route không tồn tại
const notFound = (req, res, next) => {
    //req.originalUrl: Trả về URL gốc của yêu cầu HTTP.
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}
//Trong Express.js, middleware xử lý lỗi cần phải có 4 tham số (err, req, res, next). Do đó, notFound sẽ không phải là middleware xử lý
// lỗi mà chỉ là middleware để gửi lỗi 404. Sau khi thiết lập trạng thái, bạn cần gọi next(error) để chuyển lỗi đến middleware xử lý lỗi thực sự.

const errorHandler = (err, req, res, next) => {
    const statusCode = (res.statusCode === 200) ? 500 : res.statusCode;
    return res.status(statusCode).json({
        success: false,
        errors: [{
            msg: err?.message
        }]
    })
}

module.exports = {
    notFound,
    errorHandler
}

// notFound Middleware: Được sử dụng để gửi lỗi 404 khi người dùng truy cập vào route không tồn tại và chuyển lỗi đến middleware xử lý lỗi.
// errHandler Middleware: Được sử dụng để gửi phản hồi lỗi cho client, bao gồm mã trạng thái và thông điệp lỗi.