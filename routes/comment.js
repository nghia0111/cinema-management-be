const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const commentController = require("../controllers/comment");
const isAuth = require("../middlewares/is-auth");

const commentValidation = [
  body("comment", "Không được để trống bình luận").trim().notEmpty(),
];

router.post(
  "/",
  isAuth,
  commentValidation,
  commentController.createComment
);

router.put(
  "/:commentId",
  isAuth,
  commentValidation,
  commentController.updateComment
);

router.put(
  "/:commentId/react",
  isAuth,
  commentController.reactComment
);

router.delete("/:commentId", isAuth, commentController.deleteComment);

module.exports = router;
