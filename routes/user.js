const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const userController = require("../controllers/user");
const User = require("../models/user");
const isAuth = require("../middlewares/is-auth");

const userValidation = [
  body("name", "Vui lòng cung cấp tên người dùng").trim().notEmpty(),
  body("address", "Vui lòng cung cấp địa chỉ").trim().notEmpty(),
  body("phone", "Số điện thoại không hợp lệ").isMobilePhone("vi-VN"),
  body("birthday", "Ngày sinh không hợp lệ").isISO8601().toDate(),
];

router.post(
  "/users",
  isAuth,
  [
    ...userValidation,
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
  ],
  userController.createUser
);

router.put("/users/:userId", isAuth, userValidation, userController.updateUser);

router.get("/users", isAuth, userController.getUsers);

router.delete("/users/:userId", isAuth, userController.deleteUser);

router.post(
  "/change-password",
  isAuth,
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Xác nhận mật khẩu không trùng khớp");
    }
    return true;
  }),
  userController.changePassword
);

module.exports = router;
