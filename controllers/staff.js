const { validationResult } = require("express-validator");
const sgMail = require("@sendgrid/mail");
const bcryptjs = require("bcryptjs");

const User = require("../models/user");
const Account = require("../models/account");

const { userRoles, userStatus } = require("../constants");

const { getRole } = require("../util/roles");

sgMail.setApiKey(process.env.SG_API_KEY);

exports.createStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }
  const { name, address, email, phone, gender, birthday } = req.body;

  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole != userRoles.MANAGER
    ) {
      const error = new Error(
        "Chỉ có quản lý mới được thêm nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcryptjs.hashSync(randomPassword, 12);
    const account = new Account({ username: email, password: hashedPassword });
    await account.save();

    const user = new User({
      role: userRoles.STAFF,
      account: account._id.toString(),
      name,
      address,
      email,
      phone,
      gender,
      birthday,
    });
    await user.save();

    sgMail.send({
      to: email,
      from: "20521659@gm.uit.edu.vn",
      templateId: process.env.SG_SEND_PASSWORD_TEMPLATE_ID,
      dynamicTemplateData: {
        randomPassword,
      },
    });

    res.status(201).json({ message: "Thêm nhân viên thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: userRoles.STAFF, status: userStatus.ACTIVE })
      .populate("account");
    res.status(200).json({ staff });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteStaff = async (req, res, next) => {
  const staffId = req.params.staffId;
  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole != userRoles.MANAGER
    ) {
      const error = new Error(
        "Chỉ có quản lý mới được xóa nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(staffId);
    if (!user) {
      const error = new Error("Nhân viên không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    user.status = userStatus.NONACTIVE;
    await user.save();

    res.status(200).json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteSelectedStaff = async (req, res, next) => {
  const staffIds = req.body.staffIds;
  try {
    const currentUserRole = await getRole(req.accountId);
    if (currentUserRole != userRoles.MANAGER) {
      const error = new Error(
        "Chỉ có quản lý mới được xóa nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const filteredStaff = await User.find({ _id: { $in: staffIds } });
    for (let index = 0; index < filteredUsers.length; index++) {
      const currentUser = filteredStaff[index];
      currentUser.status = userStatus.NONACTIVE;
      await currentUser.save();
    }

    res.status(200).json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.editStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const staffId = req.params.staffId;
  const { name, email, phone, address, gender, birthday } = req.body;

  try {
    const currentUserRole = await getRole(req.accountId);
    if (currentUserRole != userRoles.MANAGER && staffId != req.accountId) {
      const error = new Error("Chỉ có quản lý mới được chỉnh sửa nhân viên");
      error.statusCode = 401;
      return next(error);
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      const error = new Error("Nhân viên không tồn tại.");
      error.statusCode = 404;
      return next(error);
    }

    if (email !== user.email.toString()) {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        const error = new Error("Email đã tồn tại");
        error.statusCode = 422;
        return next(error);
      }
    }

    staff.name = name;
    staff.email = email;
    staff.phone = phone;
    staff.address = address;
    staff.gender = gender;
    staff.birthday = birthday;
    await staff.save();

    res.status(201).json({
      message: "Cập nhật thông tin thành công",
      staff
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const userId = req.params.userId;
  const newPassword = req.body.newPassword;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User không tồn tại.");
      error.statusCode = 404;
      return next(error);
    }

    const account = await Account.findById(user.account);
    if (!account) {
      const error = new Error("Account không tồn tại.");
      error.statusCode = 404;
      return next(error);
    }

    const hashedPassword = bcryptjs.hashSync(newPassword);
    account.password = hashedPassword;
    await account.save();

    res.status(200).json({ message: "Thay đổi mật khẩu thành công!" });
  } catch (err) {
    next(err);
  }
};
