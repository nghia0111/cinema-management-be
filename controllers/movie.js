const { validationResult } = require("express-validator");
const Movie = require("../models/movie");
const Genre = require("../models/genre");
const Actor = require("../models/actor");
const ShowTime = require("../models/show_time");

const { getRole } = require("../utils/roles");
const { userRoles, movieStatus } = require("../constants");

exports.createMovie = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const {
    name,
    description,
    genres,
    actors,
    director,
    thumbnail,
    images,
    duration,
    premiereDay,
    endDay,
    language,
    trailer,
  } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm phim"
      );
      error.statusCode = 401;
      return next(error);
    }

    const _movie = new Movie({
      name,
      description,
      genres,
      actors,
      director,
      thumbnail,
      images,
      duration,
      premiereDay,
      endDay,
      language,
      trailer,
    });
    await _movie.save();

    for (let actor of actors) {
      const existingActor = await Actor.findById(actor);
      if (!existingActor) {
        const err = new Error("Không tìm thấy diễn viên");
        err.statusCode = 406;
        return next(err);
      }
      existingActor.movies.push(_movie._id.toString());
    }

    const movies = await Movie.find()
      .populate("genres")
      .populate("actors", "name avatar");

    res.status(201).json({ message: "Thêm phim thành công", movies: movies });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateMovie = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const movieId = req.params.movieId;

  const {
    name,
    description,
    genres,
    actors,
    director,
    thumbnail,
    images,
    duration,
    premiereDay,
    endDay,
    language,
    trailer,
  } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa phim"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentMovie = await Movie.findById(movieId);
    if (!currentMovie) {
      const err = new Error("Không tìm thấy phim");
      err.statusCode = 406;
      next(err);
    }

    const removedActors = currentMovie.actors.reduce(
      (accumulatedActors, actor) => {
        if (!actors.includes(actor)) accumulatedActors.push(actor);
        return accumulatedActors;
      },
      []
    );
    const addedActors = actors.reduce((accumulatedActors, actor) => {
      if (!currentMovie.actors.includes(actor)) accumulatedActors.push(actor);
      return accumulatedActors;
    }, []);

    currentMovie.name = name;
    currentMovie.description = description;
    currentMovie.genres = genres;
    currentMovie.actors = actors;
    currentMovie.director = director;
    currentMovie.thumbnail = thumbnail;
    currentMovie.images = images;
    currentMovie.duration = duration;
    currentMovie.premiereDay = premiereDay;
    currentMovie.endDay = endDay;
    currentMovie.language = language;
    currentMovie.trailer = trailer;
    await currentMovie.save();

    for (let actor of addedActors) {
      const existingActor = await Actor.findById(actor);
      existingActor.movies.push(currentMovie._id);
    }
    for (let actor of removedActors) {
      const existingActor = await Actor.findById(actor);
      existingActor.movies.pull(currentMovie._id);
    }

    const movies = await Movie.find()
      .populate("genres")
      .populate("actors", "name avatar");

    res
      .status(200)
      .json({ message: "Chỉnh sửa phim thành công", movies: movies });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteMovie = async (req, res, next) => {
  const movieId = req.params.movieId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa phim"
      );
      error.statusCode = 401;
      return next(error);
    }
    const _movie = await Movie.findById(movieId);
    if (!_movie) {
      const error = new Error("Phim không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    const upcomingShowTime = await ShowTime.findOne({
      movie: movieId,
      startTime: { $gt: Date.now() },
    });
    if (upcomingShowTime) {
      const error = new Error("Không thể xóa phim do vẫn còn lịch chiếu");
      error.statusCode = 422;
      return next(error);
    }

    for (let actor of _movie.actors) {
      const existingActor = await Actor.findById(actor);
      if (!existingActor) {
        const error = new Error("Diễn viên không tồn tại");
        error.statusCode = 406;
        return next(error);
      }
      existingActor.movies.pull(_movie._id.toString());
    }

    const existingShowTime = await ShowTime.findOne({ movie: movieId });
    if (existingShowTime) {
      _movie.status = movieStatus.NONACTIVE;
      await _movie.save();
    } else await Movie.findByIdAndRemove(movieId);

    const movies = await Movies.find()
      .populate("genres")
      .populate("actors", "name avatar");
    res.status(200).json({ message: "Xoá phim thành công", movies: movies });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMovies = async (req, res, next) => {
  try {
    let movies;
    if (Object.keys(req.query).length > 0) {
      movies = await Movie.find({ status: movieStatus.ACTIVE })
        .populate("genres")
        .populate("actors", "name avatar");
    } else
      movies = await Movie.find()
        .populate("genres")
        .populate("actors", "name avatar");

    res.status(200).json({ movies });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMovieBySlug = async (req, res, next) => {
  const movieSlug = req.params.movieSlug;
  try {
    const _movie = await Movie.findOne({ slug: movieSlug })
      .populate("genres")
      .populate("actors", "name avatar");
    if (!_movie) {
      const error = new Error("Phim không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    res.status(200).json({ movie: _movie });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
