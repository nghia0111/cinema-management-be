const { validationResult } = require("express-validator");
const Transaction = require("../models/transaction");
const Ticket = require("../models/ticket");
const ShowTime = require("../models/show_time");
const Movie = require("../models/movie");

const {
  getRole,
  getLocalDate,
  getStartOfDate,
  getNextDate,
  getTransactionsByDate,
} = require("../utils/service");
const { userRoles, movieStatus } = require("../constants");

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
      status: movieStatus.ACTIVE,
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
    const report = {};
    report.date = getStartOfDate(date);
    const data = {};
    const movies = {};
    const items = {};
    let ticketIds = [];

    const transactions = await Transaction.find({
      date: {
        $gte: getStartOfDate(date),
        $lt: getNextDate(getStartOfDate(date)),
      },
    }).populate({ path: "items.id" });;
    for (let transaction of transactions) {
      ticketIds = [...ticketIds, ...transaction.tickets];
    }
    const soldTickets = await Ticket.find({
      _id: { $in: ticketIds },
    }).populate({
      path: "showTime",
      select: "movie",
      populate: { path: "movie", select: "name thumbnail" },
    });
    for (let ticket of soldTickets) {
      if (!movies.hasOwnProperty(ticket.showTime.movie._id.toString())) {
        movies[ticket.showTime.movie._id.toString()] = {
          name: ticket.showTime.movie.name,
          thumbnail: ticket.showTime.movie.thumbnail,
          soldTicketQuantity: 1,
          ticketRevenue: ticket.price,
        };
      } else {
        movies[ticket.showTime.movie._id.toString()].soldTicketQuantity += 1;
        movies[ticket.showTime.movie._id.toString()].ticketRevenue +=
          ticket.price;
      }
    }
    data.movies = movies;
    for (let transaction of transactions) {
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
    console.log(transactions)
    for (let transaction of transactions) {
      //get index of data from date in transaction
      //the date with auto plus 1 if hour is between 17 and 24, getHour return (hour - 17)
      let index;
      if(transaction.date.getHours() < 7) index = transaction.date.getDate() - 2;
      else index = transaction.date.getDate() - 1;
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

exports.getMovieReportByDate = async (req, res, next) => {
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
    const movieSlug = req.params.movieSlug;
    const { date } = req.body;
    const movie = await Movie.findOne({ slug: movieSlug });
    if (!movie) {
      const error = new Error("Phim không tồn tại");
      error.statusCode = 406;
      return next(error);
    }
    const report = {};
    report.movie = movie.name;
    let data;
    if (date) {
      const _date = new Date(date);
      if (!(_date instanceof Date) || isNaN(_date)) {
        const error = new Error("Ngày không hợp lệ");
        error.statusCode = 400;
        return next(error);
      }
      const show_times = await ShowTime.find({
        movie: movie._id.toString(),
        startTime: {
          $gte: getStartOfDate(_date),
          $lt: getNextDate(getStartOfDate(_date)),
        },
      });
      const showTimeIds = show_times.map((showTime) => showTime._id.toString());
      const ticketQuantity = await Ticket.find({
        showTime: { $in: showTimeIds },
      }).countDocuments();
      const soldTickets = await Ticket.find({
        showTime: { $in: showTimeIds },
        isBooked: true,
      });
      data = {};
      data.soldTicketQuantity = soldTickets.length;
      data.remainingTicketQuantity = ticketQuantity - soldTickets.length;
      data.totalRevenue = soldTickets.reduce(
        (accumulator, ticket) => accumulator + ticket.price,
        0
      );
    } else {
      data = [];
      const dates = [];
      const show_times = await ShowTime.find({
        movie: movie._id.toString(),
      }).sort({ startTime: 1 });
      for (let show_time of show_times) {
        const date = new Date(show_time.startTime);
        if(date.getHours() < 7) date.setDate(date.getDate() - 1);
        if (!dates.includes(date.toLocaleDateString("en-GB")))
          dates.push(date.toLocaleDateString("en-GB"));
      }
      for (let date of dates) {
        data.push({
          date,
          soldTicketQuantity: 0,
          remainingTicketQuantity: 0,
          totalRevenue: 0,
        });
      }
      const showTimeIds = show_times.map((showTime) => showTime._id.toString());
      const tickets = await Ticket.find({
        showTime: { $in: showTimeIds },
      }).populate("showTime", "startTime");
      for (let ticket of tickets) {
        const date = new Date(ticket.showTime.startTime);
        if (date.getHours() < 7) date.setDate(date.getDate() - 1);
        const index = data.findIndex(
          (object) =>
            object.date ===
            date.toLocaleDateString("en-GB")
        );
        if (ticket.isBooked) {
          data[index].soldTicketQuantity += 1;
          data[index].totalRevenue += ticket.price;
        } else {
          data[index].remainingTicketQuantity += 1;
        }
      }
    }
    report.data = data;
    res.status(200).json({ report });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
