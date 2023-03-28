const { validationResult } = require("express-validator");
const Post = require("../models/post");

const { getRole } = require("../utils/roles");
const { userRoles } = require("../constants");

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { title, thumbnail, content } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm bài viết"
      );
      error.statusCode = 401;
      return next(error);
    }

    const post = new Post({
      title,
      thumbnail,
      content,
      author: req.accountId
    });
    await post.save();

    const posts = await Post.find({ author: req.accountId });

    res.status(201).json({ message: "Thêm bài viết thành công", posts: posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const postId = req.params.postId;

  const { title, thumbnail, content } = req.body;
  try {
    const currentPost = await Post.findById(postId);
    if (!currentPost) {
      const err = new Error("Không tìm thấy bài viết");
      err.statusCode = 406;
      next(err);
    }

    if (req.accountId !== currentPost.author) {
      const error = new Error("Chỉ có tác giả mới được chỉnh sửa bài viết");
      error.statusCode = 401;
      return next(error);
    }

    currentPost.title = title;
    currentPost.thumbnail = thumbnail;
    currentPost.content = content;
    await currentPost.save();

    const posts = await Post.find({ author: req.accountId });

    res.status(200).json({
      message: "Chỉnh sửa bài viết thành công",
      posts: posts,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const currentPost = await Post.findById(postId);
    if (!currentPost) {
      const err = new Error("Không tìm thấy bài viết");
      err.statusCode = 406;
      next(err);
    }

    const role = await getRole(req.accountId);
    if (req.accountId !== currentPost.author && role !== userRoles.OWNER) {
      const error = new Error("Chỉ có tác giả hoặc chủ rạp mới được xóa bài viết");
      error.statusCode = 401;
      return next(error);
    }
    await Post.findByIdAndRemove(postId);
    const posts = await Post.find({ author: req.accountId });
    res.status(200).json({ message: "Xoá bài viết thành công", posts: posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.accountId });

    res.status(200).json({ posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate("author", "name avatar");

    res.status(200).json({ posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getPostBySlug = async (req, res, next) => {
  const postSlug = req.params.postSlug;
  try {
    const post = await Post.findOne({ slug: postSlug }).populate(
      "author",
      "name avatar"
    );
    if (!post) {
      const err = new Error("Không tìm thấy bài viết");
      err.statusCode = 406;
      next(err);
    }

    post.view += 1;
    await post.save();

    res.status(200).json({ post });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
