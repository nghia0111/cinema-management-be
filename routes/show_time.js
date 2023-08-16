const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const showTimeController = require("../controllers/show_time");
const isAuth = require("../middlewares/is-auth");

const showTimeValidation = [
  body("startTime", "Thời gian bắt đầu không hợp lệ").isISO8601().toDate(),
  body("singlePrice", "Giá ghế đơn không hợp lệ").isInt({ min: 0 }),
  body("doublePrice", "Giá ghế đôi không hợp lệ").isInt({ min: 0 }),
];

router.post(
  "/",
  isAuth,
  showTimeValidation,
  showTimeController.createShowTime
);

router.put(
  "/:showTimeId",
  isAuth,
  showTimeValidation,
  showTimeController.updateShowTime
);

router.get(
  "/:showTimeId",
  showTimeController.getShowTimeById
);

router.get(
  "/",
  showTimeController.getShowTimes
);

router.delete("/:showTimeId", isAuth, showTimeController.deleteShowTime);

module.exports = router;
