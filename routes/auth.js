const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const User = require("../models/user");

const authController = require("../controllers/auth");

router.post("/login", authController.login);

router.post(
  "/signup",
  [
    body("username", "Tên đăng nhập phải chứa ít nhất 5 ký tự")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("password", "Mật khẩu phải chứa ít nhất 5 ký tự")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Xác nhận mật khẩu không trùng khớp");
      }
      return true;
    }),
    body("name", "Tên không được để trống").notEmpty().trim(),
    body("address", "Địa chỉ không được để trống").notEmpty().trim(),
    body("email")
      .isEmail()
      .withMessage("Email không hợp lệ")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email đã tồn tại, vui lòng chọn email khác");
          }
        });
      })
      .normalizeEmail(),
    body("phone", "Số điện thoại không hợp lệ").isMobilePhone("vi-VN"),
    body("birthday", "Ngày sinh không hợp lệ").isDate(),
  ],
  authController.signup
);

router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .withMessage("Email không hợp lệ")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("Email không tồn tại");
          }
        });
      })
      .normalizeEmail(),
  ],
  authController.resetPassword
);

router.post("/change-password", authController.changePassword);

module.exports = router;
