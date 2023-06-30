const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const ratingController = require("../controllers/rating");
const isAuth = require("../middlewares/is-auth");

const ratingValidation = [
  body(
    "score",
    "Điểm đánh giá phải lớn hơn hoặc bằng 1 và nhỏ hơn hoặc bằng 5"
  ).isInt({ min: 1, max: 5 })
];

router.post(
  "/ratings",
  isAuth,
  ratingValidation,
  ratingController.createRating
);

router.put(
  "/ratings/:ratingId",
  isAuth,
  ratingValidation,
  ratingController.updateRating
);

router.delete("/ratings/:ratingId", isAuth, ratingController.deleteRating);

module.exports = router;
