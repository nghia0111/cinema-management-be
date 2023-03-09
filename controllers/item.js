const { validationResult } = require("express-validator");
const Item = require("../models/item");

const { getRole } = require("../utils/roles");
const { userRoles } = require("../constants");
const cloudinary = require("../utils/cloudinaryConfig");

exports.createItem = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { name, image, price } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm đồ ăn nhẹ"
      );
      error.statusCode = 401;
      return next(error);
    }

    const res = await cloudinary.uploader.upload(image, {folder: "cinema-app/items"});

    const _item = new Item({
      name,
      image: {imageUrl: res.secure_url, imageId: res.public_id},
      price
    });
    await _item.save();

    res
      .status(201)
      .json({ message: "Thêm sản phẩm thành công", item: item });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const itemId = req.params.itemId;

  const { name, image, price } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa đồ ăn nhẹ"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentItem = await Item.findById(itemId);
    if (!currentItem) {
      const err = new Error("Không tìm thấy sản phẩm");
      err.statusCode = 406;
      next(err);
    }

    currentItem.name = name;
    currentItem.image = image;
    currentItem.price = price;
    await currentItem.save();

    res
      .status(200)
      .json({ message: "Chỉnh sửa sản phẩm thành công", item: currentItem });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteItem = async (req, res, next) => {
  const itemId = req.params.itemId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa đồ ăn nhẹ"
      );
      error.statusCode = 401;
      return next(error);
    }
    await Item.findByIdAndRemove(itemId);
    res.status(200).json({ message: "Xoá sản phẩm thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getItems = async (req, res, next) => {
  try {
    const items = await Item.find();

    res.status(200).json({ items });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
