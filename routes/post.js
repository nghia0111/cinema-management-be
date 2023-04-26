const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const postController = require("../controllers/post");
const isAuth = require("../middlewares/is-auth");

const postValidation = [
  body("title", "Vui lòng cung cấp tiêu đề bài viết").trim().notEmpty(),
  body("thumbnail", "Vui lòng cung cấp ảnh minh họa cho bài viết")
    .trim()
    .notEmpty(),
  body("content", "Vui lòng cung cấp nội dung bài viết").trim().notEmpty(),
];

router.get("/posts", postController.getAllPosts);

router.get("/my-posts", isAuth, postController.getMyPosts);

router.get("/posts/:postSlug", postController.getPostBySlug);

router.post(
  "/my-posts",
  isAuth,
  postValidation,
  postController.createPost
);

router.put(
  "/my-posts/:postId",
  isAuth,
  postValidation,
  postController.updatePost
);

router.delete("/my-posts/:postId", isAuth, postController.deletePost);

module.exports = router;
