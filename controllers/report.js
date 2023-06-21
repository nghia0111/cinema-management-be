const { validationResult } = require("express-validator");
const Transaction = require("../models/transaction");
const Ticket = require("../models/ticket");
const ShowTime = require("../models/show_time");
const Movie = require("../models/movie");

const {
  getRole,
  getLocalDate,
  getNextDate,
  getTransactionsByDate,
} = require("../utils/service");
const { userRoles } = require("../constants");

exports.getDashboardData = async (req, res, next) => {
  try {
    const role = await getRole(req.accountId);
    if (role != userRoles.MANAGER && role != userRoles.OWNER) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem báo cáo"
      );
      error.statusCode = 401;
      return next(error);
    }
    const data = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const nextDate = new Date();
    nextDate.setHours(24, 0, 0, 0);
    const transactions = await Transaction.find({
      createdAt: { $gte: currentDate, $lt: new Date() },
    });
    data.revenue = transactions.reduce(
      (accumulator, transaction) => accumulator + transaction.totalPrice,
      0
    );
    const show_times = await ShowTime.find({
      startTime: { $gte: currentDate, $lt: nextDate },
    });
    const showTimeIds = show_times.map((st) => st._id);
    const tickets = await Ticket.find({ showTime: { $in: showTimeIds } });
    data.soldTickets = tickets.filter((ticket) => ticket.isBooked).length;
    data.remainingTickets = tickets.length - data.soldTickets;
    const movies = await Movie.find({
      endDay: { $gt: getLocalDate() },
      premiereDay: { $lte: getLocalDate() },
    }).countDocuments();
    data.onGoingMovies = movies;
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-items")
      .populate("staff", "name")
      .populate("customer", "name");
    for (let i = 0; i < recentTransactions.length; i++) {
      const ticket = await Ticket.findById(
        recentTransactions[i].tickets[0]
      ).populate({
        path: "showTime",
        select: "movie",
        populate: { path: "movie", select: "name thumbnail" },
      });
      let transaction = recentTransactions[i].toJSON();
      transaction.movie = {
        name: ticket.showTime.movie.name,
        thumbnail: ticket.showTime.movie.thumbnail,
      };
      recentTransactions[i] = { ...transaction };
    }
    data.recentTransactions = recentTransactions;
    res.status(200).json({ data });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getDailyReport = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }
  try {
    const role = await getRole(req.accountId);
    if (role != userRoles.MANAGER && role != userRoles.OWNER) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem báo cáo"
      );
      error.statusCode = 401;
      return next(error);
    }
    const { date } = req.body;
    const showTimes = await ShowTime.find({
      startTime: { $gte: date, $lt: getNextDate(date) },
    }).populate("movie", "name thumbnail");
    const report = {};
    report.date = date;
    const data = {};
    const movies = {};
    const items = {};
    const showTimeIds = [];
    const ticketIds = [];
    for (let showTime of showTimes) {
      showTimeIds.push(showTime._id.toString());
      movies[showTime.movie._id] = {
        name: showTime.movie.name,
        thumbnail: showTime.movie.thumbnail,
        soldTicketQuantity: 0,
        ticketRevenue: 0,
      };
    }
    const soldTickets = await Ticket.find({
      showTime: { $in: showTimeIds },
      isBooked: true,
    }).populate("showTime", "movie");
    for (let ticket of soldTickets) {
      ticketIds.push(ticket._id.toString());
      movies[ticket.showTime.movie].soldTicketQuantity += 1;
      movies[ticket.showTime.movie].ticketRevenue += ticket.price;
    }
    data.movies = movies;
    const transactions = await Transaction.find({
      createdAt: { $lt: getNextDate(date) },
    }).populate({ path: "items.id" });
    const expectedTransactions = transactions.filter((tran) =>
      ticketIds.includes(tran.tickets[0].toString())
    );
    for (let transaction of expectedTransactions) {
      for (let item of transaction.items) {
        if (!items.hasOwnProperty(item.id._id.toString())) {
          items[item.id._id.toString()] = {
            name: item.id.name,
            quantity: item.quantity,
            totalPrice: item.id.price * item.quantity,
            image: item.id.image,
          };
        } else {
          items[item.id._id.toString()].quantity += item.quantity;
          items[item.id._id.toString()].totalPrice +=
            item.id.price * item.quantity;
        }
      }
    }
    data.items = items;
    report.data = data;
    res.status(200).json({ report });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMonthlyReport = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }
  try {
    const role = await getRole(req.accountId);
    if (role != userRoles.MANAGER && role != userRoles.OWNER) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem báo cáo"
      );
      error.statusCode = 401;
      return next(error);
    }
    const { month, year } = req.body;
    const startDate = new Date(year, month);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(24, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    //get the first date of next month
    const _endDate = getLocalDate(endDate);

    const report = {};
    report.month = month;
    report.year = year;
    const data = [];
    for (
      let currentDate = getLocalDate(startDate);
      currentDate < _endDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      data.push({
        date: new Date(currentDate),
        ticketRevenue: 0,
        itemRevenue: 0,
        totalRevenue: 0,
      });
    }

    const transactions = await getTransactionsByDate(
      getLocalDate(startDate),
      _endDate
    );
    for (let transaction of transactions) {
      //get index of data from date in transaction
      const index = transaction.date.getDate() - 1;
      data[index].ticketRevenue += transaction.ticketRevenue;
      data[index].totalRevenue += transaction.totalPrice;
      data[index].itemRevenue +=
        transaction.totalPrice - transaction.ticketRevenue;
    }
    report.data = data;
    res.status(200).json({ report });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getAnnualReport = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }
  try {
    const role = await getRole(req.accountId);
    if (role != userRoles.MANAGER && role != userRoles.OWNER) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem báo cáo"
      );
      error.statusCode = 401;
      return next(error);
    }
    const { year } = req.body;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 12, 0);
    endDate.setHours(24, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    //get the first date of next year
    const _endDate = getLocalDate(endDate);

    const report = {};
    report.year = year;
    const data = [];
    for (let month = 1; month <= 12; month++) {
      data.push({
        month: month,
        ticketRevenue: 0,
        itemRevenue: 0,
        totalRevenue: 0,
      });
    }
    const transactions = await getTransactionsByDate(
      getLocalDate(startDate),
      _endDate
    );
    for (let transaction of transactions) {
      //get index of data from date in transaction
      const index = transaction.date.getMonth();
      data[index].ticketRevenue += transaction.ticketRevenue;
      data[index].totalRevenue += transaction.totalPrice;
      data[index].itemRevenue +=
        transaction.totalPrice - transaction.ticketRevenue;
    }
    report.data = data;
    res.status(200).json({ report });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
