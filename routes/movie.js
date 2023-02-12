const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const movieController = require("../controllers/movie");
const isAuth = require("../middlewares/is-auth");

const movieValidation = [
  body("name", "Vui lòng cung cấp tên phim").trim().notEmpty(),
  body("genres", "Vui lòng cung cấp mô tả").notEmpty(),
  body("actors", "Vui lòng cung cấp diễn viên tham gia").notEmpty(),
  body("director", "Vui lòng cung cấp tên đạo diễn").trim().notEmpty(),
  body("thumbnail", "Vui lòng cung cấp ảnh bìa cho phim").trim().notEmpty(),
  body("time", "Thời lượng phim không hợp lệ").isFloat({ min: 0 }),
  body("premiereDate", "Ngày khởi chiếu không hợp lệ").isISO8601().toDate(),
  body("language", "Vui lòng cung cấp ngôn ngữ").trim().notEmpty(),
];

router.get("/movies", isAuth, movieController.getMovies);

router.get("/movies/:movieId", isAuth, movieController.getMovieById);

router.post("/movies", isAuth, movieValidation, movieController.createMovie);

router.put(
  "/movies/:movieId",
  isAuth,
  movieValidation,
  movieController.updateMovie
);

router.delete("/movies/:movieId", isAuth, movieController.deleteMovie);

module.exports = router;
