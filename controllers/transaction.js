const { validationResult } = require("express-validator");
const Ticket = require("../models/ticket");
const Item = require("../models/item");
const Transaction = require("../models/transaction");
const User = require("../models/user");

const { getRole } = require("../utils/service");
const { userRoles, seatTypes } = require("../constants");

exports.createTransaction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { tickets, items } = req.body;
  try {
    const existingTickets = await Ticket.find({
      _id: { $in: tickets },
    }).populate("seat", "name");
    if (existingTickets.length !== tickets.length) {
      const err = new Error("Lịch chiếu đã bị hủy, vui lòng thử lại sau");
      err.statusCode = 406;
      return next(err);
    }
    const bookedTicket = existingTickets.find(
      (ticket) => ticket.isBooked === true
    );
    if (bookedTicket) {
      const err = new Error(
        `Vé ${bookedTicket.seat.name} đã được đặt, vui lòng chọn vé khác`
      );
      err.statusCode = 422;
      return next(err);
    }
    let itemCount = 0;
    let itemPrice = 0;
    for (let item of items) {
      const existingItem = await Item.findById(item.id);
      if (existingItem) {
        itemCount++;
        itemPrice += existingItem.price * item.quantity;
      }
    }
    if (items.length !== itemCount) {
      const err = new Error("Món không tồn tại, vui lòng thử lại sau");
      err.statusCode = 406;
      return next(err);
    }
    let totalPrice = existingTickets.reduce(
      (accumulator, ticket) => accumulator + ticket.price,
      itemPrice
    );

    const user = await User.findOne({ account: req.accountId });

    const transaction = new Transaction({
      tickets,
      items,
      totalPrice,
    });
    if (user.role === userRoles.CUSTOMER)
      transaction.customer = user._id.toString();
    else transaction.staff = user._id.toString();
    await transaction.save();

    res.status(201).json({ message: "Đặt vé thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const user = await User.findOne({ account: req.accountId });
    let transactions;
    if (user.role === userRoles.CUSTOMER) {
      transactions = await Transaction.find({ customer: user._id.toString() })
        .populate("staff", "name")
        .populate("customer", "name")
        .populate({
          path: "tickets",
          select: "seat",
          populate: { path: "seat", select: "name" },
        })
        .populate({ path: "items.id", select: "-image" });
    } else transactions = await Transaction.find()
      .populate("staff", "name")
      .populate("customer", "name")
      .populate({
        path: "tickets",
        select: "seat",
        populate: { path: "seat", select: "name" },
      })
      .populate({ path: "items.id", select: "-image" });
    let _transactions = []
    for(let transaction of transactions){
      const ticketId = transaction.tickets[0]._id;
      const existingTicket = await Ticket.findById(ticketId).populate({path: "showTime", select: "startTime movie", populate: {path: "movie", select: "name"}});
      transaction = transaction.toJSON();
      transaction.showTime = {
        startTime: existingTicket.showTime.startTime,
        movie: existingTicket.showTime.movie.name,
      };
      _transactions.push(transaction);
    }
    
    res.status(200).json({ _transactions });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
