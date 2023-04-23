const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");

const { getRole } = require("../utils/roles");
const { userRoles, postStatus } = require("../constants");

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { title, thumbnail, content, status } = req.body;
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

    const author = await User.findOne({ account: req.accountId });

    const post = new Post({
      title,
      thumbnail,
      content,
      author: author._id,
      status: status ? postStatus.PUBLIC : postStatus.DRAFT,
    });
    await post.save();

    const posts = await Post.find({ author: author._id });

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

  const { title, thumbnail, content, status } = req.body;
  try {
    const currentPost = await Post.findById(postId);
    if (!currentPost) {
      const err = new Error("Không tìm thấy bài viết");
      err.statusCode = 406;
      next(err);
    }

    const currentUser = await User.findOne({ account: req.accountId });

    if (currentUser._id.toString() !== currentPost.author.toString()) {
      const error = new Error("Chỉ có tác giả mới được chỉnh sửa bài viết");
      error.statusCode = 401;
      return next(error);
    }

    currentPost.title = title;
    currentPost.thumbnail = thumbnail;
    currentPost.content = content;
    currentPost.status = status ? postStatus.PUBLIC : postStatus.DRAFT;
    await currentPost.save();

    const posts = await Post.find({ author: currentUser._id });

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
    const currentPost = await Post.findById(postId).populate("author", "role");
    if (!currentPost) {
      const err = new Error("Không tìm thấy bài viết");
      err.statusCode = 406;
      next(err);
    }

    const role = await getRole(req.accountId);
    const currentUser = await User.findOne({ account: req.accountId });
    if (
      currentUser._id.toString() !== currentPost.author.toString() &&
      role !== userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có tác giả, quản lý hoặc chủ rạp mới được xóa bài viết"
      );
      error.statusCode = 401;
      return next(error);
    }
    if (currentPost.author.role === userRoles.MANAGER && role === userRoles.MANAGER) {
      const error = new Error("Quản lý chỉ được xóa bài viết nhân viên cấp dưới");
      error.statusCode = 401;
      return next(error);
    }

    await Post.findByIdAndRemove(postId);
    const posts = await Post.find({ author: currentUser._id });
    res.status(200).json({ message: "Xoá bài viết thành công", posts: posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const currentUser = await User.findOne({ account: req.accountId });
    const posts = await Post.find({ author: currentUser._id });

    res.status(200).json({ posts });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: postStatus.PUBLIC }).populate(
      "author",
      "name avatar"
    );

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
