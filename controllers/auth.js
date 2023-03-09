const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const sgMail = require("../utils/sendGridConfig");

const Account = require("../models/account");
const User = require("../models/user");
const { getRole } = require("../utils/roles");
const { userRoles } = require("../constants");

exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const account = await Account.findOne({ username });
    if (!account) {
      const error = new Error("Tên đăng nhập không tồn tại");
      error.statusCode = 401;
      return next(error);
    }

    const isValidPassword = bcryptjs.compareSync(password, account.password);
    if (!isValidPassword) {
      const error = new Error("Mật khẩu không đúng");
      error.statusCode = 401;
      return next(error);
    }
    const currentUser = await User.findOne({"account": account._id});

    const token = jwt.sign(
      {
        username: account.username,
        accountId: account._id.toString(),
      },
      "secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, user: currentUser });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { username, password, name, address, email, phone, gender, birthday } = req.body;

  try {
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      const error = new Error("Tên đăng nhập đã tồn tại");
      error.statusCode = 422;
      return next(error);
    }

    const hashedPassword = bcryptjs.hashSync(password, 12);

    const account = new Account({ username, password: hashedPassword });
    await account.save();

    const user = new User({
      role: userRoles.CUSTOMER,
      account: account._id.toString(),
      name,
      address,
      email,
      phone,
      gender,
      birthday,
    });
    await user.save();
    res.status(200).json({ message: "Đăng ký thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    const token = buffer.toString("hex");
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        const err = new Error("Email chưa được đăng ký");
        err.statusCode = 406;
        return next(err);
      }

      const account = await Account.findOne({
        _id: user.account.toString(),
      });
      if (!account) {
        const err = new Error("Tài khoản không tồn tại");
        err.statusCode = 406;
        return next(err);
      }

      account.resetToken = token;
      account.resetTokenExpiration = Date.now() + 3600000;
      await account.save();

      sgMail.send({
        to: req.body.email,
        from: process.env.EMAIL,
        templateId: process.env.SG_RESET_PASSWORD_TEMPLATE_ID,
        dynamicTemplateData: {
          token: token,
          userName: user.name
        },
      });

      res.status(200).json({
        message: "Gửi yêu cầu khôi phục mật khẩu thành công",
        accountId: account._id,
      });
    } catch (err) {
      const error = new Error("Có lỗi xảy ra, vui lòng thử lại sau");
      error.statusCode = 500;
      next(error);
    }
  });
};

exports.changePassword = async (req, res, next) => {
  const { password: newPassword, passwordToken, accountId } = req.body;

  try {
    const account = await Account.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: accountId,
    });

    if (!account) {
      const err = new Error(
        "Tài khoản không tồn tại hoặc link đã hết thời hạn"
      );
      err.statusCode = 406;
      return next(err);
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 12);
    account.password = hashedPassword;
    account.resetToken = undefined;
    account.resetTokenExpiration = undefined;
    await account.save();

    res.status(201).json({ message: "Thay đổi mật khẩu thành công" });
  } catch (err) {
    const error = new Error("Có lỗi xảy ra, vui lòng thử lại sau");
    error.statusCode = 500;
    next(error);
  }
};
