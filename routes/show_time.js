const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const showTimeController = require("../controllers/show_time");
const isAuth = require("../middlewares/is-auth");
const showTime = require("../models/show_time");

const showTimeValidation = [
  body("startTime", "Thời gian bắt đầu không hợp lệ").isISO8601().toDate(),
  body("singlePrice", "Giá ghế đơn không hợp lệ").isInt({ min: 0 }),
  body("doublePrice", "Giá ghế đôi không hợp lệ").isInt({ min: 0 }),
];

router.post(
  "/show-times",
  isAuth,
  showTimeValidation,
  showTimeController.createShowTime
);

router.put(
  "/show-times/:showTimeId",
  isAuth,
  showTimeValidation,
  showTimeController.updateShowTime
);

router.get(
  "/show-times/:showTimeId",
  showTimeController.getShowTimeById
);

router.get(
  "/show-times",
  showTimeController.getUpComingShowTime
);

router.post("/show-times-by-date", showTimeController.getShowTimesByDate);


module.exports = router;
