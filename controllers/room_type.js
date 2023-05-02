const { validationResult } = require("express-validator");
const RoomType = require("../models/room_type");
const Room = require("../models/room");

const { getRole } = require("../utils/service");
const { userRoles } = require("../constants");

exports.createRoomType = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { name } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm loại phòng"
      );
      error.statusCode = 401;
      return next(error);
    }

    const type = new RoomType({
      name,
    });
    await type.save();
    const roomTypes = await RoomType.find();

    res.status(201).json({ message: "Thêm loại phòng thành công" , roomTypes: roomTypes});
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateRoomType = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const roomTypeId = req.params.roomTypeId;

  const { name } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa loại phòng"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentRoomType = await RoomType.findById(roomTypeId);
    if (!currentRoomType) {
      const err = new Error("Không tìm thấy loại phòng");
      err.statusCode = 406;
      next(err);
    }

    currentRoomType.name = name;
    await currentRoomType.save();
    const roomTypes = await RoomType.find();

    res.status(200).json({
      message: "Chỉnh sửa loại phòng thành công",
      roomTypes: roomTypes,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteRoomType = async (req, res, next) => {
  const roomTypeId = req.params.roomTypeId;
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
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      const error = new Error("Loại phòng không tồn tại");
      error.statusCode = 406;
      return next(error);
    }
    const rooms = await Room.findOne({ roomType: roomTypeId });
    if (rooms) {
      const error = new Error(
        "Không thể xóa loại phòng do vẫn còn phòng thuộc loại này"
      );
      error.statusCode = 422;
      return next(error);
    }
    await RoomType.findByIdAndRemove(roomTypeId);
    const roomTypes = await RoomType.find();
    res.status(200).json({ message: "Xoá loại phòng thành công", roomTypes: roomTypes });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await RoomType.find();

    res.status(200).json({ roomTypes });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
