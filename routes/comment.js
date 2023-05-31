const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const commentController = require("../controllers/comment");
const isAuth = require("../middlewares/is-auth");

const commentValidation = [
  body("comment", "Không được để trống bình luận").trim().notEmpty(),
];

router.post(
  "/comments",
  isAuth,
  commentValidation,
  commentController.createComment
);

router.put(
  "/comments/:commentId",
  isAuth,
  commentValidation,
  commentController.updateComment
);

router.put(
  "/comments/:commentId/react",
  isAuth,
  commentController.reactComment
);

router.delete("/comments/:commentId", isAuth, commentController.deleteComment);

module.exports = router;
