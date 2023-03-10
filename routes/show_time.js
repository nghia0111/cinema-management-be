const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const showTimeController = require("../controllers/show_time");
const isAuth = require("../middlewares/is-auth");
const showTime = require("../models/show_time");

const showTimeValidation = [
  body("startTime", "Thời gian bắt đầu không hợp lệ").isDate(),
  body("singlePrice", "Giá ghế đơn không hợp lệ").isInt({ min: 0 }),
  body("doublePrice", "Giá ghế đôi không hợp lệ").isInt({ min: 0 }),
];

router.post("/show-times", isAuth, showTimeValidation, showTimeController.createShowTime);

router.put(
  "/showTimes/:showTimeId",
  isAuth,
  showTimeValidation,
  showTimeController.updateShowTime
);

module.exports = router;
