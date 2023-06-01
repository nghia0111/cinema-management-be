const User = require("../models/user");
const Transaction = require("../models/transaction");
const Ticket = require("../models/ticket");

exports.getRole = async (accountId) => {
  const existingUser = await User.findOne({ account: accountId });
  if (existingUser) {
    return existingUser.role;
  }
};

exports.getLocalDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 7);
  return date;
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
    const transactions = await Transaction.find(selector)
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
        movieId: existingTicket.showTime.movie._id,
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
