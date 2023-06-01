const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const itemController = require("../controllers/item");
const isAuth = require("../middlewares/is-auth");

const itemValidation = [
  body("name", "Vui lòng cung cấp tên sản phẩm").trim().notEmpty(),
  body("price", "Giá sản phẩm không hợp lệ").trim().isInt({min: 0}),
];

router.get("/items", itemController.getItems);

router.post("/items", isAuth, itemValidation, itemController.createItem);

router.put(
  "/items/:itemId",
  isAuth,
  itemValidation,
  itemController.updateItem
);

router.delete("/items/:itemId", isAuth, itemController.deleteItem);

module.exports = router;
