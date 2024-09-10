const Order = require("../models/order")
const User = require("../models/user")
const Bill = require("../models/bill")
const Product = require("../models/product")
const asyncHandler = require('express-async-handler')
//Thống kê/Quản lý kho  - Tổng số sp, danh mục mặt hàng sắp hết, danh mục mặt hàng bán chạy, ...

//Thống kê - tài khoản 
// 1. Tổng số tài khoản 
// 2. Số tài khoản còn sử dụng
// 3. Số tài khoản bị khóa
// 4. Số tài khoản đã mua hàng trong tháng ----

//Thống kê - doanh thu
// 1. Doanh thu trong khoảng thời gian quy định
// 2. ....

// Start 28/08/2024 - 30/08/2024
// I. Thống kê quản lý kho :

const getProductsData = asyncHandler(async (req, res) => {
    try {
        const { type, limit } = req.query;
        const limitValue = parseInt(limit) || 10; // Mặc định là 10 nếu không có giá trị `limit`
        // 1. Tổng mặt hàng
        const productCount = await Product.countDocuments();
        // 2. Hàng sắp hết 
        if (type === 'almostSold') {
            const almostSold = await Product.find({ stock: { $lte: 20 } }).limit(limitValue).select("_id name sold stock images ");
            return res.status(200).json({
                success: true,
                almostSold: almostSold.length,
                data: almostSold,
                totalProducts: productCount
            });
        }
        // 3. Mặt hàng bán chạy 
        if (type === 'bestSell') {
            const bestSell = await Product.find().sort({ sold: -1 }).limit(limitValue);
            return res.status(200).json({
                success: true,
                bestSell: bestSell.length,
                data: bestSell,
                totalProducts: productCount
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            msg: 'Cannot get products',
            error: err.message
        });
    }
});
//II. Thống kê tài khoản :----
// thống kế tổng số người sùng
// const getTotalUsers = async (req, res) => {
//     try {
//         const userCount = await User.countDocuments();
//         res.status(200).json({ totalUsers: userCount });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const getUsersByRole = async (req, res) => {
//     try {
//         const usersByRole = await User.aggregate([
//             {
//                 $group: {
//                     _id: "$role",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         res.status(200).json({ usersByRole });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const getBlockedUsers = async (req, res) => {
//     try {
//         const blockedUsers = await User.countDocuments({ isBlock: true });
//         res.status(200).json({ blockedUsers });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// III. Thống kê doanh thu
// 1. Doanh thu từ các đơn hàng theo thời gian năm/tháng/ngày
const getRevenueByTime = asyncHandler(async (req, res) => {
    const { startDate, endDate, interval, compareYears } = req.query;

    try {
        const currentStartDate = new Date(startDate);
        const currentEndDate = new Date(endDate);

        if (isNaN(currentStartDate.getTime()) || isNaN(currentEndDate.getTime())) {
            return res.status(400).json({ error: 'Định dạng ngày không hợp lệ' });
        }

        // Giai đoạn lọc cho các hóa đơn có trạng thái 'paid'
        const matchStage = {
            $match: {
                paymentStatus: "paid",
                paymentDate: {
                    $gte: currentStartDate,
                    $lte: currentEndDate
                }
            }
        };

        // Xác định giai đoạn nhóm theo khoảng thời gian
        let groupStage;
        switch (interval) {
            case 'daily':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
                        totalRevenue: { $sum: "$amountDue" }
                    }
                };
                break;
            case 'weekly':
                groupStage = {
                    $group: {
                        _id: {
                            year: { $isoWeekYear: "$paymentDate" },
                            week: { $isoWeek: "$paymentDate" }
                        },
                        totalRevenue: { $sum: "$amountDue" }
                    }
                };
                break;
            case 'monthly':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
                        totalRevenue: { $sum: "$amountDue" }
                    }
                };
                break;
            case 'yearly':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y", date: "$paymentDate" } },
                        totalRevenue: { $sum: "$amountDue" }
                    }
                };
                break;
            default:
                groupStage = {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amountDue" }
                    }
                };
                break;
        }

        const projectStage = {
            $project: {
                _id: 0,
                interval: "$_id",
                totalRevenue: 1
            }
        };

        // Tạo mảng chứa pipelines
        const pipelines = [
            [matchStage, groupStage, projectStage]
        ];

        // Kiểm tra nếu có compareYears
        if (compareYears) {
            // Tạo các khoảng thời gian để so sánh
            const compareDates = Array.from({ length: compareYears }, (_, i) => ({
                startDate: new Date(currentStartDate.getFullYear() - (i + 1), currentStartDate.getMonth(), currentStartDate.getDate()),
                endDate: new Date(currentEndDate.getFullYear() - (i + 1), currentEndDate.getMonth(), currentEndDate.getDate()),
                label: `Năm ${i + 1} Trước`
            }));

            // Tạo giai đoạn lọc cho các năm trước và thêm vào pipelines
            const matchStages = compareDates.map(({ startDate, endDate }) => ({
                $match: {
                    paymentDate: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    paymentStatus: "paid"
                }
            }));

            // Thêm các pipelines cho năm trước vào mảng pipelines
            pipelines.push(...matchStages.map(matchStage => [
                matchStage,
                groupStage,
                projectStage
            ]));
        }

        // Chạy từng pipeline và lưu kết quả
        const results = await Promise.all(pipelines.map(pipeline => Bill.aggregate(pipeline)));

        // Tạo dữ liệu trả về
        const response = {
            current: results[0] // Dữ liệu cho khoảng thời gian hiện tại
        };

        // Nếu có so sánh, thêm dữ liệu so sánh vào response
        if (compareYears) {
            response.comparisons = results.slice(1).map((data, index) => ({
                label: `Năm ${index + 1} Trước`,
                data
            }));
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Lỗi trong getRevenueByTime:', error);
        res.status(500).json({ error: error.message });
    }
});




// 2. Thống kê đơn hàng theo trạng thái
const getOrderCountByStatus = asyncHandler(async (req, res) => {
    try {
        const orderCount = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1
                }
            }
        ]);

        // console.log("Order Count by Status:", orderCount);  // Logging để kiểm tra dữ liệu
        res.status(200).json(orderCount);
    } catch (error) {
        console.error("Error getting order count by status:", error);  // Logging lỗi
        res.status(500).json({ success: false, error: error.message });
    }
});
// 3. Thống kê đơn thành theo phương thức thanh toán
const getRevenueByPaymentMethod = async (req, res) => {
    try {
        const [summary] = await Order.aggregate([
            {
                $facet: {
                    // Tổng số tiền thanh toán và số hóa đơn theo trạng thái thanh toán
                    paymentSummary: [
                        {
                            $group: {
                                _id: "$paymentMethod",
                                totalAmount: { $sum: "$totalAmount" },
                                orderCount: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                paymentMethod: "$_id",
                                totalAmount: 1,
                                orderCount: 1
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json(summary.paymentSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
//4. Thống kê số lượng đơn hàng theo thời gian
const getOrderCountByTime = asyncHandler(async (req, res) => {
    const { startDate, endDate, interval, compareYears } = req.query;

    try {
        const currentStartDate = new Date(startDate);
        const currentEndDate = new Date(endDate);

        if (isNaN(currentStartDate.getTime()) || isNaN(currentEndDate.getTime())) {
            return res.status(400).json({ error: 'Định dạng ngày không hợp lệ' });
        }

        // Giai đoạn lọc cho các hóa đơn có trạng thái 'paid'
        const matchStage = {
            $match: {
                paymentStatus: "paid",
                paymentDate: {
                    $gte: currentStartDate,
                    $lte: currentEndDate
                }
            }
        };

        // Xác định giai đoạn nhóm theo khoảng thời gian
        let groupStage;
        switch (interval) {
            case 'daily':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
                        totalOrders: { $sum: 1 }
                    }
                };
                break;
            case 'weekly':
                groupStage = {
                    $group: {
                        _id: {
                            year: { $isoWeekYear: "$paymentDate" },
                            week: { $isoWeek: "$paymentDate" }
                        },
                        totalOrders: { $sum: 1 }
                    }
                };
                break;
            case 'monthly':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
                        totalOrders: { $sum: 1 }
                    }
                };
                break;
            case 'yearly':
                groupStage = {
                    $group: {
                        _id: { $dateToString: { format: "%Y", date: "$paymentDate" } },
                        totalOrders: { $sum: 1 }
                    }
                };
                break;
            default:
                groupStage = {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 }
                    }
                };
                break;
        }

        const projectStage = {
            $project: {
                _id: 0,
                interval: "$_id",
                totalOrders: 1
            }
        };

        // Thêm giai đoạn sắp xếp theo thời gian
        const sortStage = {
            $sort: { interval: 1 } // 1 để sắp xếp tăng dần, -1 để sắp xếp giảm dần
        };

        // Tạo mảng chứa pipelines
        const pipelines = [
            [matchStage, groupStage, projectStage, sortStage]
        ];

        // Kiểm tra nếu có compareYears
        if (compareYears) {
            // Tạo các khoảng thời gian để so sánh
            const compareDates = Array.from({ length: compareYears }, (_, i) => ({
                startDate: new Date(currentStartDate.getFullYear() - (i + 1), currentStartDate.getMonth(), currentStartDate.getDate()),
                endDate: new Date(currentEndDate.getFullYear() - (i + 1), currentEndDate.getMonth(), currentEndDate.getDate()),
                label: `Năm ${i + 1} Trước`
            }));

            // Tạo giai đoạn lọc cho các năm trước và thêm vào pipelines
            const matchStages = compareDates.map(({ startDate, endDate }) => ({
                $match: {
                    paymentDate: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    paymentStatus: "paid"
                }
            }));

            // Thêm các pipelines cho năm trước vào mảng pipelines
            pipelines.push(...matchStages.map(matchStage => [
                matchStage,
                groupStage,
                projectStage,
                sortStage
            ]));
        }

        // Chạy từng pipeline và lưu kết quả
        const results = await Promise.all(pipelines.map(pipeline => Bill.aggregate(pipeline)));

        // Tạo dữ liệu trả về
        const response = {
            current: results[0] // Dữ liệu cho khoảng thời gian hiện tại
        };

        // Nếu có so sánh, thêm dữ liệu so sánh vào response
        if (compareYears) {
            response.comparisons = results.slice(1).map((data, index) => ({
                label: `Năm ${index + 1} Trước`,
                data
            }));
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Lỗi trong getOrderStatistics:', error);
        res.status(500).json({ error: error.message });
    }
});

//5. Thống kê theo lượng sản phẩm
const getRevenueByProduct = async (req, res) => {
    try {
        const revenueByProduct = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    productId: "$_id",
                    name: "$productDetails.name",
                    totalRevenue: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json(revenueByProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProductsData,
    getRevenueByTime,
    getOrderCountByStatus,
    getRevenueByPaymentMethod,
    getOrderCountByTime,
    getRevenueByProduct
}