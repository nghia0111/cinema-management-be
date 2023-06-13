const { validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const sgMail = require("../utils/sendGridConfig");
const User = require("../models/user");
const Account = require("../models/account");

const { userRoles, userStatus } = require("../constants");

const { getRole } = require("../utils/service");

exports.createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }
  const { role, name, address, email, phone, gender, birthday } = req.body;

  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole != userRoles.MANAGER &&
      currentUserRole != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được thêm nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    if (currentUserRole === userRoles.MANAGER && role === userRoles.MANAGER) {
      const error = new Error("Quản lý chỉ được thêm nhân viên cấp dưới");
      error.statusCode = 401;
      return next(error);
    }

    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcryptjs.hashSync(randomPassword, 12);
    const account = new Account({ username: email, password: hashedPassword });
    await account.save();

    const user = new User({
      role,
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
      from: process.env.EMAIL,
      templateId: process.env.SG_SEND_PASSWORD_TEMPLATE_ID,
      dynamicTemplateData: {
        randomPassword,
        userName: user.name,
      },
    });

    const users = await User.find({
      role: { $in: [userRoles.STAFF, userRoles.MANAGER] },
      status: userStatus.ACTIVE,
    });
    res
      .status(201)
      .json({ message: "Thêm nhân viên thành công", users: users });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole != userRoles.MANAGER &&
      currentUserRole != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xem danh sách nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }
    const users = await User.find({
      role: { $in: [userRoles.STAFF, userRoles.MANAGER] },
      status: userStatus.ACTIVE,
    }).populate("account");
    res.status(200).json({ users });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole != userRoles.MANAGER &&
      currentUserRole != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ rạp mới được xóa nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Nhân viên không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    if (
      currentUserRole === userRoles.MANAGER &&
      user.role === userRoles.MANAGER
    ) {
      const error = new Error("Quản lý chỉ được xóa nhân viên cấp dưới");
      error.statusCode = 401;
      return next(error);
    }

    user.status = userStatus.NONACTIVE;
    await user.save();
    const users = await User.find({
      role: { $in: [userRoles.STAFF, userRoles.MANAGER] },
      status: userStatus.ACTIVE,
    });

    res.status(200).json({ message: "Xóa nhân viên thành công", users: users });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const userId = req.params.userId;
  const { role, name, email, phone, address, gender, birthday } = req.body;

  try {
    const currentUserRole = await getRole(req.accountId);
    if (
      currentUserRole !== userRoles.MANAGER &&
      currentUserRole !== userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý hoặc chủ quán mới được chỉnh sửa nhân viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Nhân viên không tồn tại.");
      error.statusCode = 404;
      return next(error);
    }

    if (
      user.role === userRoles.MANAGER &&
      currentUserRole === userRoles.MANAGER
    ) {
      const error = new Error("Quản lý chỉ được chỉnh sửa nhân viên cấp dưới");
      error.statusCode = 401;
      return next(error);
    }

    if (user.role !== role && currentUserRole !== userRoles.OWNER) {
      const error = new Error(
        "Chỉ có chủ rạp mới được thay đổi cấp bậc nhân viên"
      );
      error.statusCode = 401;
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
    await Account.findOneAndUpdate(
      { username: user.email },
      { username: email }
    );

    user.role = role;
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.gender = gender;
    user.birthday = birthday;

    await user.save();

    res.status(201).json({
      message: "Cập nhật thông tin thành công",
      user: user,
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
  const { password, newPassword } = req.body;

  try {
    const account = await Account.findById(req.accountId);
    if (!account) {
      const error = new Error("Tài khoản không tồn tại.");
      error.statusCode = 404;
      return next(error);
    }

    const isValidPassword = bcryptjs.compareSync(password, account.password);
    if (!isValidPassword) {
      const error = new Error("Mật khẩu không đúng");
      error.statusCode = 401;
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