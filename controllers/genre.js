const { validationResult } = require("express-validator");
const Movie = require("../models/movie");
const Genre = require("../models/genre");

const { getRole } = require("../utils/roles");
const { userRoles } = require("../constants");

exports.createGenre = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { name } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm thể loại phim"
      );
      error.statusCode = 401;
      return next(error);
    }

    const genre = new Genre({
      name,
    });
    await genre.save();

    const genres = await Genre.find();

    res.status(201).json({ message: "Thêm thể loại phim thành công", genres: genres});
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateGenre = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const genreId = req.params.genreId;

  const { name } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa thể loại phim"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentGenre = await Genre.findById(genreId);
    if (!currentGenre) {
      const err = new Error("Không tìm thấy thể loại phim");
      err.statusCode = 406;
      next(err);
    }

    currentGenre.name = name;
    await currentGenre.save();

    res.status(200).json({
      message: "Chỉnh sửa thể loại phim thành công",
      genre: currentGenre,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteGenre = async (req, res, next) => {
  const genreId = req.params.genreId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa thể loại phim"
      );
      error.statusCode = 401;
      return next(error);
    }
    const genre = await Genre.findById(genreId);
    if (!genre) {
      const error = new Error("Thể loại phim không tồn tại");
      error.statusCode = 406;
      return next(error);
    }
    const movies = await Movie.find({ _id: { $in: genre.movies } });
    let hasGenres = true;
    for (let movie of movies) {
      if (movie.genres.length < 2) {
        hasGenres = false;
        break;
      }
    }
    if (!hasGenres) {
      const error = new Error(
        "Phim phải gồm tối thiểu 2 thể loại để xóa thể loại này"
      );
      error.statusCode = 422;
      return next(error);
    }
    for (let movie of movies) {
      movie.genres.pull(genreId);
      await movie.save();
    }
    await Genre.findByIdAndRemove(genreId);
    const genres = await Genre.find();
    res.status(200).json({ message: "Xoá thể loại phim thành công", genres: genres });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find();

    res.status(200).json({ genres });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
