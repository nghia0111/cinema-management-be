const { validationResult } = require("express-validator");
const Room = require("../models/room");
const Seat = require("../models/seat");
const ShowTime = require("../models/show_time");
const Movie = require("../models/movie");
const Ticket = require("../models/ticket");

const { getRole, getLocalDate, getNextDate } = require("../utils/service");
const { userRoles, seatTypes } = require("../constants");

exports.createShowTime = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { startTime, roomId, movieId, singlePrice, doublePrice } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm lịch chiếu"
      );
      error.statusCode = 401;
      return next(error);
    }

    const room = await Room.findById(roomId);
    if (!room) {
      const err = new Error("Không tìm thấy phòng");
      err.statusCode = 406;
      return next(err);
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }
    if (startTime < getLocalDate()) {
      const err = new Error("Lịch chiếu không hợp lệ");
      err.statusCode = 422;
      return next(err);
    }

    let endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + movie.duration);

    const conflictShowTime = await ShowTime.findOne({
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      room: roomId,
    });
    if (conflictShowTime) {
      const err = new Error("Không thể thêm lịch chiếu do trùng lịch");
      err.statusCode = 422;
      return next(err);
    }

    const show_time = new ShowTime({
      startTime,
      room: roomId,
      movie: movieId,
      duration: movie.duration,
      singlePrice,
      doublePrice,
    });
    await show_time.save();

    const tickets = await Promise.all(
      room.seats.map((rowSeats) => {
        const rowTickets = Promise.all(
          rowSeats.map(async (seat) => {
            const currentSeat = await Seat.findById(seat.seatId);
            if (currentSeat.type === seatTypes.SINGLE) {
              const ticket = new Ticket({
                showTime: show_time._id.toString(),
                seat: seat.seatId,
                price: singlePrice,
              });
              await ticket.save();
              return { ticketId: ticket._id.toString(), isBooked: false };
            } else if (currentSeat.type === seatTypes.DOUBLE) {
              const ticket = new Ticket({
                showTime: show_time._id.toString(),
                seat: seat.seatId,
                price: doublePrice,
              });
              await ticket.save();
              return { ticketId: ticket._id.toString(), isBooked: false };
            }
          })
        );
        return rowTickets;
      })
    );

    show_time.tickets = tickets;
    await show_time.save();

    const showTimes = await ShowTime.find({
      startTime: { $gt: getLocalDate(), $lte: getNextDate() },
    })
      .populate("room", "name")
      .populate("movie", "name duration");

    res.status(201).json({ message: "Thêm lịch chiếu thành công", showTimes });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateShowTime = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const showTimeId = req.params.showTimeId;

  const { startTime, roomId, movieId, singlePrice, doublePrice } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được sửa lịch chiếu"
      );
      error.statusCode = 401;
      return next(error);
    }

    const room = await Room.findById(roomId);
    if (!room) {
      const err = new Error("Không tìm thấy phòng");
      err.statusCode = 406;
      return next(err);
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }

    if (startTime < getLocalDate()) {
      const err = new Error("Lịch chiếu không hợp lệ");
      err.statusCode = 422;
      return next(err);
    }

    let endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + movie.duration);

    const conflictShowTime = await ShowTime.findOne({
      room: roomId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      _id: { $ne: showTimeId },
    });
    if (conflictShowTime) {
      const err = new Error("Không thể thêm lịch chiếu do trùng lịch");
      err.statusCode = 422;
      return next(err);
    }

    const currentShowTime = await ShowTime.findById(showTimeId);
    for (let rowTickets of currentShowTime.tickets) {
      const isBooked = rowTickets.findIndex((ticket) => {
        if (ticket) return ticket.isBooked == true;
      });
      if (isBooked !== -1) {
        const err = new Error(
          "Không thể thay đổi lịch chiếu do có vé đã được đặt"
        );
        err.statusCode = 422;
        return next(err);
      }
    }

    //create tickets for new room
    if (roomId !== currentShowTime.room.toString()) {
      const oldTickets = await Ticket.find({ showTime: showTimeId });
      const tickets = await Promise.all(
        room.seats.map((rowSeats) => {
          const rowTickets = Promise.all(
            rowSeats.map(async (seat) => {
              const currentSeat = await Seat.findById(seat.seatId);
              if (currentSeat.type === seatTypes.SINGLE) {
                const ticket = new Ticket({
                  showTime: show_time._id.toString(),
                  seat: seat.seatId,
                  price: singlePrice,
                });
                await ticket.save();
                return { ticketId: ticket._id.toString(), isBooked: false };
              } else if (currentSeat.type === seatTypes.DOUBLE) {
                const ticket = new Ticket({
                  showTime: show_time._id.toString(),
                  seat: seat.seatId,
                  price: doublePrice,
                });
                await ticket.save();
                return { ticketId: ticket._id.toString(), isBooked: false };
              }
            })
          );
          return rowTickets;
        })
      );
      // delete old tickets
      currentShowTime.tickets = tickets;
      await Ticket.deleteMany(oldTickets);
    } else {
      const singleSeat = await Seat.findOne({
        room: roomId.toString(),
        type: seatTypes.SINGLE,
      });
      const singleTicket = await Ticket.findOne({
        showTime: showTimeId.toString(),
        seat: singleSeat._id.toString(),
      });
      const doubleSeat = await Seat.findOne({
        room: roomId.toString(),
        type: seatTypes.DOUBLE,
      });
      const doubleTicket = await Ticket.findOne({
        showTime: showTimeId,
        seat: doubleSeat._id,
      });
      if (singleTicket && singleTicket.price != singlePrice) {
        const singleTickets = await Ticket.find({
          showTime: showTimeId,
        })
          .populate({ path: "seat", match: { type: seatTypes.SINGLE } })
          .then((tickets) => tickets.filter((ticket) => ticket.seat != null));
        for (let ticket of singleTickets) {
          ticket.price = singlePrice;
          await ticket.save();
        }
      }
      if (doubleTicket && doubleTicket.price != doublePrice) {
        const doubleTickets = await Ticket.find({
          showTime: showTimeId,
        })
          .populate({ path: "seat", match: { type: seatTypes.DOUBLE } })
          .then((tickets) => tickets.filter((ticket) => ticket.seat != null));
        for (let ticket of doubleTickets) {
          ticket.price = doublePrice;
          await ticket.save();
        }
      }
    }

    currentShowTime.startTime = startTime;
    currentShowTime.room = roomId;
    currentShowTime.movie = movieId;
    currentShowTime.duration = movie.duration;
    currentShowTime.singlePrice = singlePrice;
    currentShowTime.doublePrice = doublePrice;
    await currentShowTime.save();

    const showTimes = await ShowTime.find({
      startTime: { $gt: getLocalDate(), $lte: getNextDate() },
    })
      .populate("room", "name")
      .populate("movie", "name duration");

    res.status(200).json({
      message: "Chỉnh sửa lịch chiếu thành công",
      showTimes,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getShowTimeById = async (req, res, next) => {
  const showTimeId = req.params.showTimeId;
  try {
    const showTime = await ShowTime.findById(showTimeId)
      .populate("room", "name")
      .populate("movie", "name duration");
    if (!showTime) {
      const error = new Error("Lịch chiếu không tồn tại");
      error.statusCode = 406;
      return next(error);
    }
    for (let i = 0; i < showTime.tickets.length; i++) {
      const nullIndices = [];
      for (let j = 0; j < showTime.tickets[i].length; j++) {
        if (showTime.tickets[i][j] === null) {
          nullIndices.push(j);
        }
      }
      showTime.tickets[i] = showTime.tickets[i].filter(
        (ticket) => ticket !== null
      );
      await showTime.save();
      if (showTime.tickets[i].length > 0)
        await showTime.populate({
          path: `tickets.${i}.ticketId`,
          select: "seat price",
          populate: { path: "seat", select: "name type" },
        });
      for (let k = 0; k < nullIndices.length; k++) {
        if (showTime.tickets[i].length == 0) {
          showTime.tickets[i] = [null];
        } else {
          const temp = [...showTime.tickets[i]];
          temp.splice(nullIndices[k], 0, null);
          showTime.tickets[i] = temp;
        }
      }
      showTime.markModified("tickets");
      await showTime.save();
    }

    res.status(200).json({ showTime });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteShowTime = async (req, res, next) => {
  const showTimeId = req.params.showTimeId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa lịch chiếu"
      );
      error.statusCode = 401;
      return next(error);
    }
    const showTime = await ShowTime.findById(showTimeId);
    if (!showTime) {
      const error = new Error("Lịch chiếu không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    for (let ticketRows of showTime.tickets) {
      const isBooked = ticketRows.findIndex(
        (ticket) => ticket.isBooked === true
      );
      if (isBooked !== -1) {
        const error = new Error(
          "Không thể xóa lịch chiếu do đã có khách hàng đặt vé"
        );
        error.statusCode = 422;
        return next(error);
      }
    }

    await Ticket.deleteMany({ showTime: showTimeId });
    await ShowTime.findByIdAndRemove(showTimeId);

    const showTimes = await ShowTime.find({
      startTime: { $gt: getLocalDate(), $lte: getNextDate() },
    })
      .populate("room", "name")
      .populate("movie", "name duration");
    res.status(200).json({ message: "Xoá lịch chiếu thành công", showTimes });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getShowTimes = async (req, res, next) => {
  try {
    let showTimes;
    if (Object.keys(req.query).length > 0) {
      const date = req.query.date;
      if (!date || !getNextDate(date).getTime()) {
        const error = new Error("Có lỗi xảy ra, vui lòng thử lại sau");
        error.statusCode = 404;
        return next(error);
      }
      showTimes = await ShowTime.find({
        startTime: { $gte: date, $lt: getNextDate() },
      });
    } else {
      showTimes = await ShowTime.find({ startTime: { $gt: getLocalDate() } });
    }
    await showTimes
      .select("-tickets")
      .populate("room", "name")
      .populate("movie", "name duration");

    res.status(200).json({ showTimes });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
