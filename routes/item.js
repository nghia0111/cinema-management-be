const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const itemController = require("../controllers/item");
const isAuth = require("../middlewares/is-auth");

const itemValidation = [
  body("name", "Vui lòng cung cấp tên sản phẩm").trim().notEmpty(),
  body("price", "Giá sản phẩm không hợp lệ").trim().isInt({min: 0}),
];

router.get("/", itemController.getItems);

router.post("/", isAuth, itemValidation, itemController.createItem);

router.put(
  "/:itemId",
  isAuth,
  itemValidation,
  itemController.updateItem
);

router.delete("/:itemId", isAuth, itemController.deleteItem);

module.exports = router;
