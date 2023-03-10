const express = require("express");

const isAuth = require("../middlewares/is-auth");
const router = express.Router();
const cloudinary = require("../utils/cloudinaryConfig");

router.post("/upload-image", isAuth, async (req, res, next) => {
  if (!req.accountId) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  if (!req.files) {
    const error = new Error("No files provided");
    error.statusCode = 400;
    return next(error);
  }

  const filePaths = [];
  for (const file of req.files) {
    const result = await cloudinary.uploader.upload(file, {
      folder: "cinema-app",
      invalidate: true
    });
    filePaths.push(result.secure_url);
  }

  return res.status(201).json({
    message: "File stored",
    filePaths: filePaths,
  });
});