const Transaction = require("../models/transaction");
const Ticket = require("../models/ticket");
const ShowTime = require("../models/show_time");

const { getRole } = require("../utils/service");
const { userRoles } = require("../constants");

exports.getDashboardData = async (req, res, next) => {
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem báo cáo"
      );
      error.statusCode = 401;
      return next(error);
    }
    const data = {};
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    const nextDate = new Date();
    nextDate.setHours(24, 0, 0, 0);
    const transactions = await Transaction.find({createdAt: {$gte: currentDate, $lt: new Date()}});
    data.revenue = transactions.reduce((accumulator, transaction) => accumulator + transaction.totalPrice, 0);
    const show_times = await ShowTime.find({startTime: {$gte: currentDate, $lt: nextDate}});
    const showTimeIds = show_times.map(st => st._id);
    const tickets = await Ticket.find({showTime: {$in: showTimeIds}});
    data.soldTickets = tickets.filter(ticket => ticket.isBooked).length;
    data.remainingTickets = tickets.length - data.soldTickets;
    const recentTransactions = await Transaction.find().sort({createdAt: -1}).limit(5);
    data.recentTransactions = recentTransactions;
    res.status(200).json({ data });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
