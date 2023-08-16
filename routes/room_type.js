const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const roomTypeController = require("../controllers/room_type");
const isAuth = require("../middlewares/is-auth");
const RoomType = require("../models/room_type");

const roomTypeValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng cung cấp tên loại phòng")
    .custom((value, { req }) => {
      return RoomType.findOne({ name: value }).then((roomTypeDoc) => {
        if (roomTypeDoc) {
          return Promise.reject("Loại phòng đã tồn tại");
        }
      });
    }),
];

router.get("/", isAuth, roomTypeController.getRoomTypes);

router.post("/", isAuth, roomTypeValidation, roomTypeController.createRoomType);

router.put(
  "/:roomTypeId",
  isAuth,
  roomTypeValidation,
  roomTypeController.updateRoomType
);

router.delete("/:roomTypeId", isAuth, roomTypeController.deleteRoomType);

module.exports = router;
