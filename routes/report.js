const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const reportController = require("../controllers/report");
const isAuth = require("../middlewares/is-auth");

const reportValidation = [
  body("date", "Ngày không hợp lệ").isISO8601().toDate(),
];

router.get(
  "/dashboard",
  isAuth,
  reportController.getDashboardData
);

router.post("/daily-report", isAuth, reportValidation, reportController.getDailyReport)

module.exports = router;