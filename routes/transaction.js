const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const transactionController = require("../controllers/transaction");
const isAuth = require("../middlewares/is-auth");

const transactionValidation = [
  body("tickets", "Vui lòng chọn vé cần đặt").isArray({ min: 1 }),
  body("items.*.quantity", "Số lượng bắp nước phải lớn hơn 0").isInt({ min: 1 }),
];

router.post(
  "/",
  isAuth,
  transactionValidation,
  transactionController.createTransaction
);

router.get("/", isAuth, transactionController.getTransactions);

router.get("/:transactionId", isAuth, transactionController.getTransactionById);

module.exports = router;
