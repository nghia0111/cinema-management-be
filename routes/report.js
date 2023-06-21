const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const reportController = require("../controllers/report");
const isAuth = require("../middlewares/is-auth");

router.get(
  "/dashboard",
  isAuth,
  reportController.getDashboardData
);

router.post(
  "/daily-report",
  isAuth,
  [body("date", "Ngày không hợp lệ").isISO8601().toDate()],
  reportController.getDailyReport
);

router.post(
  "/monthly-report",
  isAuth,
  [
    body("month", "Tháng không hợp lệ").isInt({ min: 0, max: 11 }),
    body("year", "Năm không hợp lệ").isInt({min: 1970}),
  ],
  reportController.getMonthlyReport
);

module.exports = router;