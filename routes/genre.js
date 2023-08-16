const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const genreController = require("../controllers/genre");
const isAuth = require("../middlewares/is-auth");
const Genre = require("../models/genre");

const genreValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng cung cấp tên thể loại phim")
    .custom((value, { req }) => {
      return Genre.findOne({ name: value }).then((genreDoc) => {
        if (genreDoc) {
          return Promise.reject("Thể loại phim đã tồn tại");
        }
      });
    }),
];

router.get("/", isAuth, genreController.getGenres);

router.post("/", isAuth, genreValidation, genreController.createGenre);

router.put(
  "/:genreId",
  isAuth,
  genreValidation,
  genreController.updateGenre
);

router.delete("/:genreId", isAuth, genreController.deleteGenre);

module.exports = router;
