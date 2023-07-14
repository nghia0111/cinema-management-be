const { validationResult } = require("express-validator");
const User = require("../models/user");
const Movie = require("../models/movie");
const Rating = require("../models/rating");
const Transaction = require("../models/transaction");
const { getTransactionById } = require("../utils/service");

exports.createRating = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { score, transactionId, description } = req.body;
  try {
    const reviewer = await User.findOne({ account: req.accountId });
    const existingTransaction = await getTransactionById(transactionId);
    if (existingTransaction.customer?._id.toString() !== reviewer._id.toString()) {
      const err = new Error("Giao dịch không hợp lệ");
      err.statusCode = 406;
      return next(err);
    }
    const _movie = await Movie.findById(existingTransaction.showTime.movieId);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }
    const _rating = new Rating({
      reviewer: reviewer._id.toString(),
      score,
      description,
    });
    await _rating.save();
    const _transaction = await Transaction.findById(transactionId);
    _transaction.review = _rating._id.toString();
    await _transaction.save();
    const transaction = await getTransactionById(transactionId);
    _movie.reviews.push(_rating._id);
    _movie.totalScore += score;
    await _movie.save();

    res.status(201).json({
      message: "Thêm đánh giá thành công",
      transaction: transaction,
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

  const { score, description } = req.body;
  try {
    const _transaction = await Transaction.findOne({review: ratingId});
    if (!_transaction) {
      const err = new Error("Không tìm thấy giao dịch");
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

    const oldTransaction = await getTransactionById(_transaction._id);
    const movieId = oldTransaction.showTime.movieId;
    const _movie = await Movie.findById(movieId);
    _movie.totalScore = _movie.totalScore - currentRating.score + score;
    await _movie.save();

    currentRating.score = score;
    currentRating.description = description;
    await currentRating.save();

    const transaction = await getTransactionById(_transaction._id);

    res.status(200).json({
      message: "Chỉnh sửa đánh giá thành công",
      transaction: transaction,
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
    const _transaction = await Transaction.findOne({ review: ratingId });
    if (!_transaction) {
      const err = new Error("Không tìm thấy giao dịch");
      err.statusCode = 406;
      return next(err);
    }
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
    _movie.totalScore -= currentRating.score;
    await _movie.save();
    _transaction.review = undefined;
    await _transaction.save();
    await Rating.findByIdAndRemove(ratingId);
    const transaction = await getTransactionById(_transaction._id)

    res
      .status(200)
      .json({ message: "Xoá đánh giá thành công", transaction: transaction });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
