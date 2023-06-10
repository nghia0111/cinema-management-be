const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report");
const isAuth = require("../middlewares/is-auth");

router.get(
  "/dashboard",
  isAuth,
  reportController.getDashboardData
);

module.exports = router;
