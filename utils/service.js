const User = require("../models/user");
const Transaction = require("../models/transaction");
const Ticket = require("../models/ticket");

exports.getRole = async (accountId) => {
  const existingUser = await User.findOne({ account: accountId });
  if (existingUser) {
    return existingUser.role;
  }
};

// adjust datetime to correct timezone
exports.getLocalDate = (date) => {
  let copy;
  if(date) copy = new Date(date);
  else copy = new Date();
  copy.setHours(copy.getHours() + 7);
  return copy;
};

// adjust datetime to correct timezone and set hour to 0
exports.getStartOfDate = (date) => {
  let copy;
  if (date) copy = new Date(date);
  else copy = new Date();
  copy.setHours(copy.getHours() + 7);
  if (copy.getHours() >= 7) {
    copy.setHours(0, 0, 0, 0);
    copy.setHours(copy.getHours() + 7);
  } else {
    copy.setHours(0, 0, 0, 0);
    copy.setHours(copy.getHours() - 17);
  }
  return copy;
};

exports.getNextDate = (date = this.getLocalDate()) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + 1);
  if (copy.getHours() >= 7) {
    copy.setHours(0, 0, 0, 0);
    copy.setHours(copy.getHours() + 7);
  } else {
    copy.setHours(0, 0, 0, 0);
    copy.setHours(copy.getHours() - 17);
  }
  return copy;
};

exports.getTransactions = async (selector) => {
  try {
    const transactions = await Transaction.find(selector).sort({createdAt: -1})
      .populate("staff", "name")
      .populate("customer", "name")
      .populate({
        path: "tickets",
        select: "seat price",
        populate: { path: "seat", select: "name" },
      })
      .populate({ path: "items.id", select: "-image" });
    let _transactions = [];
    for (let transaction of transactions) {
      const ticketId = transaction.tickets[0]._id;
      const existingTicket = await Ticket.findById(ticketId).populate({
        path: "showTime",
        select: "startTime movie",
        populate: { path: "movie", select: "name thumbnail" },
      });
      transaction = transaction.toJSON();
      transaction.showTime = {
        startTime: existingTicket.showTime.startTime,
        movieId: existingTicket.showTime.movie._id.toString(),
        movieName: existingTicket.showTime.movie.name,
        thumbnail: existingTicket.showTime.movie.thumbnail,
      };
      _transactions.push(transaction);
    }
    return _transactions;
  } catch (err) {
    throw err;
  }
};

exports.getTransactionsByDate = async (startDate, endDate) => {
  try {
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lt: endDate ? endDate : this.getNextDate(startDate) },
    }).populate({
      path: "tickets",
      select: "price",
    });
    let _transactions = [];
    for (let transaction of transactions) {
      const ticketRevenue = transaction.tickets.reduce((accumulator, ticket) => accumulator + ticket.price, 0)
      transaction = transaction.toJSON();
      transaction.ticketRevenue = ticketRevenue;
      _transactions.push(transaction);
    }
    return _transactions;
  } catch (err) {
    throw err;
  }
};

exports.getTransactionById = async (transactionId) => {
  try {
    const transaction = await Transaction.findById(transactionId)
      .populate("staff", "name")
      .populate("customer", "name")
      .populate("review")
      .populate({
        path: "tickets",
        select: "seat price",
        populate: { path: "seat", select: "name" },
      })
      .populate({ path: "items.id", select: "-image" });
    if (!transaction) {
      const err = new Error("Không tìm thấy giao dịch");
      err.statusCode = 406;
      return next(err);
    }
    const ticketId = transaction.tickets[0]._id;
    const existingTicket = await Ticket.findById(ticketId).populate({
      path: "showTime",
      select: "startTime movie",
      populate: { path: "movie", select: "name thumbnail" },
    });
    transaction = transaction.toJSON();
    transaction.showTime = {
      startTime: existingTicket.showTime.startTime,
      movieId: existingTicket.showTime.movie._id.toString(),
      movieName: existingTicket.showTime.movie.name,
      thumbnail: existingTicket.showTime.movie.thumbnail,
    };
    return transaction;
  } catch (err) {
    throw err;
  }
};
