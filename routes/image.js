const express = require("express");
const multer = require("multer");
const isAuth = require("../middlewares/is-auth");
const router = express.Router();
const cloudinary = require("../utils/cloudinaryConfig");

const upload = multer();

router.post(
  "/upload-image",
  isAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
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
      let filePath;
      await cloudinary.uploader
        .upload_stream(
          {
            folder: "cinema-app",
            invalidate: true,
          },
          (err, result) => {
            if (err) {
              const error = new Error("Tải ảnh thất bại");
              error.statusCode = 500;
              next(error);
            }
            filePath = result.secure_url;
            return res.status(201).json({
              message: "Lưu ảnh thành công",
              filePath,
            });
          }
        )
        .end(req.file.buffer);
    } catch (err) {
      const error = new Error(err.message);
      next(error);
    }
  }
);

module.exports = router;
