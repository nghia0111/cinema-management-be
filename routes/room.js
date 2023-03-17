const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const roomController = require("../controllers/room");
const isAuth = require("../middlewares/is-auth");
const Room = require("../models/room");

const roomValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng cung cấp tên phòng")
    .custom((value, { req }) => {
      return Room.findOne({ name: value }).then((roomDoc) => {
        if (roomDoc) {
          return Promise.reject("Tên phòng đã tồn tại");
        }
      });
    }),
  body("roomType", "Vui lòng chọn loại phòng").trim().notEmpty(),
  body("seats", "Vui lòng thêm ghế cho phòng").isArray({min: 1})
];

router.get("/rooms", isAuth, roomController.getRooms);

router.post(
  "/rooms",
  isAuth,
  roomValidation,
  roomController.createRoom
);

router.put(
  "/rooms/:roomId",
  isAuth,
  roomValidation,
  roomController.updateRoom
);

router.delete(
  "/rooms/:roomId",
  isAuth,
  roomController.deleteRoom
);

module.exports = router;
