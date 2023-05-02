const { validationResult } = require("express-validator");
const RoomType = require("../models/room_type");
const Room = require("../models/room");
const Seat = require("../models/seat");
const ShowTime = require("../models/show_time");
const mongoose = require("mongoose");

const { getRole } = require("../utils/service");
const { userRoles, roomStatus } = require("../constants");

exports.createRoom = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { name, roomType, seats } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm phòng"
      );
      error.statusCode = 401;
      return next(error);
    }

    const room = new Room({
      name,
      roomType,
    });
    await room.save();
    //create seats for room
    room.seats = await Promise.all(
      seats.map(async (seatRow, seatRowIndex) =>
        Promise.all(
          seatRow.map(async (seat, seatIndex) => {
            const _seat = new Seat({
              rowIndex: seatRowIndex,
              columnIndex: seatIndex,
              room: room._id.toString(),
              type: seat,
            });
            await _seat.save();
            return { seatId: _seat._id };
          })
        )
      )
    );
    await room.save();
    const rooms = await Room.find({ status: roomStatus.ACTIVE }).populate(
      "roomType"
    );

    res.status(201).json({ message: "Thêm phòng thành công", rooms: rooms });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateRoom = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const roomId = req.params.roomId;

  const { name, roomType, seats, isSeatModified } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa phòng"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentRoom = await Room.findById(roomId);
    if (!currentRoom) {
      const err = new Error("Không tìm thấy phòng");
      err.statusCode = 406;
      next(err);
    }
    const existingShowTimes = await ShowTime.findOne({
      room: currentRoom._id.toString(),
      startTime: { $gt: Date.now() },
    });
    if (existingShowTimes) {
      const err = new Error("Không thể chỉnh sửa phòng do vẫn còn lịch chiếu");
      err.statusCode = 422;
      next(err);
    }

    const existingRoom = await Room.findOne({
      name: name,
      _id: { $ne: currentRoom._id.toString() },
    });
    if (existingRoom) {
      const err = new Error("Tên phòng đã tồn tại");
      err.statusCode = 422;
      return next(err);
    }
    currentRoom.roomType = roomType;

    // only update when seats are modified
    if (isSeatModified) {
      // remove rows of old seats
      for (let i = currentRoom.seats.length - 1; i >= seats.length; i--) {
        for (let j = 0; j < currentRoom.seats[0].length; j++) {
          await Seat.findByIdAndRemove(currentRoom.seats[i][j].seatId._id);
        }
        currentRoom.seats.pop();
      }
      // remove columns of old seats
      for (let i = currentRoom.seats[0].length - 1; i >= seats[0].length; i--) {
        for (let j = 0; j < currentRoom.seats.length; j++) {
          await Seat.findByIdAndRemove(currentRoom.seats[j][i].seatId._id);
          currentRoom.seats[j].pop();
        }
      }

      for (let i = 0; i < currentRoom.seats.length; i++) {
        await currentRoom.populate({ path: `seats.${i}.seatId`, select: "type" });
      }

      for (let i = 0; i < seats.length; i++) {
        if (!currentRoom.seats[i]) currentRoom.seats.push([]);
        for (let j = 0; j < seats[i].length; j++) {
          if (!seats[i][j].seatId) {
            const seat = new Seat({
              rowIndex: i,
              columnIndex: j,
              room: currentRoom._id.toString(),
              type: seats[i][j],
            });
            await seat.save();
            currentRoom.seats[i].push({ seatId: seat._id.toString() });
          } else if (
            seats[i][j].seatId.type !== currentRoom.seats[i][j].seatId.type
          ) {
            await Seat.findByIdAndUpdate(seats[i][j].seatId._id, {
              type: seats[i][j].seatId.type,
            });
          }
        }
      }
    }
    await currentRoom.save();
    const rooms = await Room.find({ status: roomStatus.ACTIVE }).populate(
      "roomType"
    );

    res.status(200).json({
      message: "Chỉnh sửa phòng thành công",
      rooms: rooms,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteRoom = async (req, res, next) => {
  const roomId = req.params.roomId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa phòng"
      );
      error.statusCode = 401;
      return next(error);
    }
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error("Phòng không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    const _showTime = await ShowTime.findOne({
      room: roomId,
      startTime: { $gte: Date.now() },
    });
    if (_showTime) {
      const error = new Error(
        "Không thể xóa phòng do phòng vẫn còn lịch chiếu"
      );
      error.statusCode = 422;
      return next(error);
    }

    await Room.findByIdAndUpdate(
      { _id: roomId },
      { status: roomStatus.NONACTIVE }
    ).populate("roomType");
    const rooms = await Room.find({ status: roomStatus.ACTIVE });
    res.status(200).json({ message: "Xoá phòng thành công", rooms: rooms });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: roomStatus.ACTIVE }).populate(
      "roomType"
    );

    res.status(200).json({ rooms });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getRoomsByTypeId = async (req, res, next) => {
  const { roomType } = req.body;
  try {
    const rooms = await Room.find({
      roomType: roomType,
      status: roomStatus.ACTIVE,
    }).populate("roomType");
    res.status(200).json({ rooms });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getRoomById = async (req, res, next) => {
  const roomId = req.params.roomId;
  try {
    const room = await Room.findById(roomId).populate("roomType");
    if (!room) {
      const err = new Error("Không tìm thấy phòng");
      err.statusCode = 406;
      return next(err);
    }
    for (let i = 0; i < room.seats.length; i++) {
      await room.populate({ path: `seats.${i}.seatId`, select: "type" });
    }

    res.status(200).json({ room });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
