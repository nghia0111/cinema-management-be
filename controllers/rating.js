const { validationResult } = require("express-validator");
const User = require("../models/user");
const Movie = require("../models/movie");
const Rating = require("../models/rating");
const { getTransactions } = require("../utils/service");

exports.createRating = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { score, movie, description } = req.body;
  try {
    const reviewer = await User.findOne({ account: req.accountId });
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }

    const transactions = await getTransactions({
      customer: reviewer._id.toString(),
    });
    const transactionIndex = transactions.findIndex(
      (transaction) => transaction.showTime.movieId === movie
    );
    if (transactionIndex < 0) {
      const err = new Error(
        "Chức năng đánh giá phim chỉ dành cho khách hàng đã đặt vé"
      );
      err.statusCode = 422;
      return next(err);
    }
    const _rating = new Rating({
      reviewer: reviewer._id.toString(),
      score,
      description,
    });
    await _rating.save();
    _movie.reviews.push(_rating._id);
    await _movie.save();
    await _movie.populate({
      path: "reviews",
      populate: { path: "reviewer", select: "name avatar" },
    });

    res.status(201).json({
      message: "Thêm đánh giá thành công",
      reviews: _movie.reviews,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateRating = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const ratingId = req.params.ratingId;

  const { score, movie, description } = req.body;
  try {
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }
    const currentRating = await Rating.findById(ratingId);
    if (!currentRating) {
      const err = new Error("Không tìm thấy đánh giá");
      err.statusCode = 406;
      return next(err);
    }

    const currentUser = await User.findOne({ account: req.accountId });
    if (currentRating.reviewer.toString() !== currentUser._id.toString()) {
      const err = new Error("Chỉ có chủ tài khoản mới được chỉnh sửa đánh giá");
      err.statusCode = 401;
      return next(err);
    }

    currentRating.score = score;
    currentRating.description = description;
    await currentRating.save();

    await _movie.populate({
      path: "reviews",
      populate: { path: "reviewer", select: "name avatar" },
    });

    res.status(200).json({
      message: "Chỉnh sửa đánh giá thành công",
      reviews: _movie.reviews,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteRating = async (req, res, next) => {
  const ratingId = req.params.ratingId;
  const { movie } = req.body;
  try {
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }

    const currentRating = await Rating.findById(ratingId);
    if (!currentRating) {
      const err = new Error("Không tìm thấy đánh giá");
      err.statusCode = 406;
      return next(err);
    }

    const currentUser = await User.findOne({ account: req.accountId });
    if (currentUser._id.toString() !== currentRating.reviewer.toString()) {
      const error = new Error("Chỉ có tác giả mới được xóa đánh giá");
      error.statusCode = 401;
      return next(error);
    }
    _movie.reviews.pull(ratingId);
    await _movie.save();
    await _movie.populate({
      path: "reviews",
      populate: { path: "reviewer", select: "name avatar" },
    });
    res
      .status(200)
      .json({ message: "Xoá đánh giá thành công", reviews: _movie.reviews });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
