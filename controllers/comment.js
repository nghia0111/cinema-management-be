const { validationResult } = require("express-validator");
const User = require("../models/user");
const Movie = require("../models/movie");

const Comment = require("../models/comment");

exports.createComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { comment, parentComment, movie } = req.body;
  try {
    const author = await User.findOne({ account: req.accountId });
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }
    let _parentComment = null;
    if (parentComment) {
      _parentComment = await Comment.findById(parentComment);
      if (!_parentComment) {
        const err = new Error("Không tìm thấy bình luận");
        err.statusCode = 406;
        return next(err);
      }
      if (!_parentComment.isReply) {
        const err = new Error(
          "Bình luận đã đạt mức tối đa, không thể tiếp tục phản hồi"
        );
        err.statusCode = 422;
        return next(err);
      }
    }
    const _comment = new Comment({
      author: author._id.toString(),
      comment,
    });
    if (_parentComment) _comment.isReply = false;
    await _comment.save();
    if (parentComment) {
      _parentComment.replies.push(_comment._id);
      await _parentComment.save();
    } else _movie.comments.push(_comment._id);
    await _movie.save();
    await _movie.populate({
      path: "comments",
      populate: [
        { path: "author", select: "name avatar" },
        {
          path: "replies",
          populate: { path: "author", select: "name avatar" },
        },
      ],
    });

    res.status(201).json({
      message: "Thêm bình luận thành công",
      comments: _movie.comments,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const commentId = req.params.commentId;

  const { comment, movie } = req.body;
  try {
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }
    const currentComment = await Comment.findById(commentId);
    if (!currentComment) {
      const err = new Error("Không tìm thấy bình luận");
      err.statusCode = 406;
      return next(err);
    }

    const currentUser = await User.findOne({ account: req.accountId });

    if (currentUser._id.toString() !== currentComment.author.toString()) {
      const error = new Error("Chỉ có tác giả mới được chỉnh sửa bình luận");
      error.statusCode = 401;
      return next(error);
    }

    currentComment.comment = comment;
    await currentComment.save();

    await _movie.populate({
      path: "comments",
      populate: [
        { path: "author", select: "name avatar" },
        {
          path: "replies",
          populate: { path: "author", select: "name avatar" },
        },
      ],
    });

    res.status(200).json({
      message: "Chỉnh sửa bình luận thành công",
      comments: _movie.comments,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  const commentId = req.params.commentId;
  const { parentComment, movie } = req.body;
  try {
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }

    const currentComment = await Comment.findById(commentId);
    if (!currentComment) {
      const err = new Error("Không tìm thấy bình luận");
      err.statusCode = 406;
      return next(err);
    }

    const currentUser = await User.findOne({ account: req.accountId });
    if (currentUser._id.toString() !== currentComment.author.toString()) {
      const error = new Error("Chỉ có tác giả mới được xóa bình luận");
      error.statusCode = 401;
      return next(error);
    }

    for (let comment of currentComment.replies) {
      await Comment.findByIdAndRemove(comment);
    }
    await Comment.findByIdAndRemove(commentId);

    let _parentComment;
    if (parentComment) {
      _parentComment = await Comment.findById(parentComment);
      if (!_parentComment) {
        const err = new Error("Không tìm thấy bình luận");
        err.statusCode = 406;
        return next(err);
      }
      _parentComment.replies.pull(commentId);
      await _parentComment.save();
    } else {
      _movie.comments.pull(commentId);
      await _movie.save();
    }
    await _movie.populate({
      path: "comments",
      populate: [
        { path: "author", select: "name avatar" },
        {
          path: "replies",
          populate: { path: "author", select: "name avatar" },
        },
      ],
    });
    res
      .status(200)
      .json({ message: "Xoá bình luận thành công", comments: _movie.comments });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.reactComment = async (req, res, next) => {
  const comment = req.params.commentId;
  try {
    const currentUser = await User.findOne({ account: req.accountId });
    const { action, movie } = req.body;
    const _movie = await Movie.findById(movie);
    if (!_movie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      return next(err);
    }

    const currentComment = await Comment.findById(comment);
    if (!currentComment) {
      const err = new Error("Không tìm thấy bình luận");
      err.statusCode = 406;
      return next(err);
    }

    if(action === "like"){
      if (currentComment.likes.includes(currentUser._id))
        currentComment.likes.pull(currentUser._id);
      else {
        currentComment.dislikes.pull(currentUser._id);
        currentComment.likes.push(currentUser._id);
      }
    } else if(action === "dislike"){
      if (currentComment.dislikes.includes(currentUser._id))
        currentComment.dislikes.pull(currentUser._id);
      else {
        currentComment.likes.pull(currentUser._id);
        currentComment.dislikes.push(currentUser._id);
      }
    }
            await currentComment.save();
    await _movie.populate({
      path: "comments",
      populate: [
        { path: "author", select: "name avatar" },
        {
          path: "replies",
          populate: { path: "author", select: "name avatar" },
        },
      ],
    });

    res.status(200).json({ comments: _movie.comments });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
