const express = require("express");
const { body, check } = require("express-validator");
const router = express.Router();

const transactionController = require("../controllers/transaction");
const isAuth = require("../middlewares/is-auth");

const transactionValidation = [
  body("tickets", "Vui lòng chọn vé cần đặt").isArray({ min: 1 }),
  check("items.quantity").isInt({min: 0})
];

router.post("/transactions", isAuth, transactionValidation, transactionController.createTransaction);

router.get("/transactions", isAuth, transactionController.getTransactions);

// router.get("/rooms/:roomId", isAuth, roomController.getRoomById);

// router.get("/roomsByType", isAuth, roomController.getRoomsByTypeId);

// router.put("/rooms/:roomId", isAuth, roomController.updateRoom);

// router.delete("/rooms/:roomId", isAuth, roomController.deleteRoom);

module.exports = router;
