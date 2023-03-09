const { validationResult } = require("express-validator");
const Room = require("../models/room");
const Seat = require("../models/seat");
const ShowTime = require("../models/show_time");
const Movie = require("../models/movie");
const Ticket = require("../models/ticket");

const { getRole } = require("../utils/roles");
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
      next(err);
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      next(err);
    }

    if (startTime < Date.now()) {
      const err = new Error("Lịch chiếu không hợp lệ");
      err.statusCode = 422;
      next(err);
    }

    const conflictShowTime = await ShowTime.findOne({
      startTime: { $lte: startTime },
      endTime: { $gt: startTime },
    });
    if (conflictShowTime) {
      const err = new Error("Không thể thêm lịch chiếu do trùng lịch");
      err.statusCode = 422;
      next(err);
    }

    const tickets = room.seats.map((rowSeats) => {
      const rowTickets = rowSeats.map(async (seat) => {
        const currentSeat = await Seat.findById(seat);
        if (currentSeat.type === seatTypes.SINGLE) {
          const ticket = new Ticket({
            showTime: show_time._id.toString(),
            seat: seat,
            price: singlePrice,
          });
          await ticket.save();
          return { ticketId: ticket._id.toString(), isBooked: false };
        } else if (currentSeat.type === seatTypes.DOUBLE) {
          const ticket = new Ticket({
            showTime: show_time._id.toString(),
            seat: seat,
            price: doublePrice,
          });
          await ticket.save();
          return { ticketId: ticket._id.toString(), isBooked: false };
        }
      });
      return rowTickets;
    });

    const show_time = new ShowTime({
      startTime,
      roomId,
      movieId,
      duration: movie.duration,
      tickets,
    });

    res.status(201).json({ message: "Thêm lịch chiếu thành công" });
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
      next(err);
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      next(err);
    }

    if (startTime < Date.now()) {
      const err = new Error("Lịch chiếu không hợp lệ");
      err.statusCode = 422;
      next(err);
    }

    const conflictShowTime = await ShowTime.findOne({
      room: roomId,
      startTime: { $lte: startTime },
      endTime: { $gt: startTime },
      _id: { $ne: showTimeId },
    });
    if (conflictShowTime) {
      const err = new Error("Không thể thêm lịch chiếu do trùng lịch");
      err.statusCode = 422;
      next(err);
    }

    const currentShowTime = await ShowTime.findById(showTimeId);
    for (let rowTickets of currentShowTime.tickets) {
      const isBooked = rowTickets.findIndex(
        (ticket) => ticket.isBooked == true
      );
      if (isBooked !== -1) {
        const err = new Error(
          "Không thể thay đổi lịch chiếu do có vé đã được đặt"
        );
        err.statusCode = 422;
        next(err);
      }
    }

    //create tickets for new room
    if (roomId !== currentShowTime.room) {
      const oldTickets = await Ticket.find({ showTime: showTimeId });
      const tickets = room.seats.map((rowSeats) => {
        const rowTickets = rowSeats.map(async (seat) => {
          const currentSeat = await Seat.findById(seat);
          if (currentSeat.type === seatTypes.SINGLE) {
            const ticket = new Ticket({
              showTime: show_time._id.toString(),
              seat: seat,
              price: singlePrice,
            });
            await ticket.save();
            return { ticketId: ticket._id.toString(), isBooked: false };
          } else if (currentSeat.type === seatTypes.DOUBLE) {
            const ticket = new Ticket({
              showTime: show_time._id.toString(),
              seat: seat,
              price: doublePrice,
            });
            await ticket.save();
            return { ticketId: ticket._id.toString(), isBooked: false };
          }
        });
        return rowTickets;
      });
      // delete old tickets
      currentShowTime.tickets = tickets;
      await Ticket.deleteMany(oldTickets);
    } else {
      if (
        currentShowTime.singlePrice != singlePrice ||
        currentShowTime.doublePrice != doublePrice
      ) {
        const tickets = await Ticket.find({ showTime: showTimeId }).populate(
          "seat",
          "type"
        );
        if (currentShowTime.singlePrice != singlePrice) {
          for (let ticket of tickets) {
            if (ticket.seat.type === seatTypes.SINGLE) {
              ticket.price = singlePrice;
              await ticket.save();
            }
          }
        }
        if (currentShowTime.doublePrice != doublePrice) {
          for (let ticket of tickets) {
            if (ticket.seat.type === seatTypes.DOUBLE) {
              ticket.price = doublePrice;
              await ticket.save();
            }
          }
        }
      }
    }

    currentShowTime.startTime = startTime;
    currentShowTime.room = roomId;
    currentShowTime.movie = movieId;
    currentShowTime.duration = movie.duration;
    await currentShowTime.save();

    res.status(200).json({
      message: "Chỉnh sửa lịch chiếu thành công",
      showTime: currentShowTime,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
