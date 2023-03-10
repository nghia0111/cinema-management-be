const express = require("express");

const isAuth = require("../middlewares/is-auth");
const router = express.Router();
const cloudinary = require("../utils/cloudinaryConfig");

router.post("/upload-image", isAuth, async (req, res, next) => {
  if (!req.accountId) {
    const error = new Error("Vui lòng đăng nhập để tiếp tục sử dụng");
    error.statusCode = 401;
    return next(error);
  }

  if (!req.file) {
    const error = new Error("Vui lòng cung cấp ảnh");
    error.statusCode = 400;
    return next(error);
  }

  if (
    req.file.mimetype !== "image/png" &&
    req.file.mimetype !== "image/jpg" &&
    req.file.mimetype !== "image/jpeg" &&
    req.file.mimetype !== "image/webp"
  ) {
    const error = new Error("Ảnh không hợp lệ");
    error.statusCode = 400;
    return next(error);
  }
    const result = await cloudinary.uploader.upload(req.file, {
      folder: "cinema-app",
      invalidate: true
    });

    const filePath = result.secure_url;

  return res.status(201).json({
    message: "Lưu ảnh thành công",
    filePath
  });
});

module.exports = router;