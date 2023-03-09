const { validationResult } = require("express-validator");
const Movie = require("../models/movie");
const Genre = require("../models/genre");
const Actor = require("../models/actor");

const { getRole } = require("../utils/roles");
const { userRoles } = require("../constants");

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
    time,
    premiereDay,
    endDay,
    language,
    trailer
  } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (role != userRoles.STAFF && role != userRoles.MANAGER && role != userRoles.OWNER) {
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
      time,
      premiereDay,
      endDay,
      language,
      trailer
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

    for (let genre of genres) {
      const existingGenre = await Genre.findById(genre);
      if (!existingGenre) {
        const err = new Error("Không tìm thấy thể loại");
        err.statusCode = 406;
        return next(err);
      }
      existingGenre.movies.push(_movie._id.toString());
    }

    res.status(201).json({ message: "Thêm phim thành công", movie: _movie });
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
    time,
    premiereDay,
    endDay,
    language,
    trailer
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

    const removedGenres = currentMovie.genres.reduce(
      (accumulatedGenres, genre) => {
        if (!genres.includes(genre)) accumulatedGenres.push(genre);
        return accumulatedGenres;
      },
      []
    );
    const addedGenres = genres.reduce((accumulatedGenres, genre) => {
      if (!currentMovie.genres.includes(genre)) accumulatedGenres.push(genre);
      return accumulatedGenres;
    }, []);
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
    currentMovie.time = time;
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

    for (let genre of addedGenres) {
      const existingGenre = await Genre.findById(genre);
      existingGenre.movies.push(currentMovie._id);
    }
    for (let genre of removedGenres) {
      const existingGenre = await Genre.findById(genre);
      existingGenre.movies.pull(currentMovie._id);
    }

    res
      .status(200)
      .json({ message: "Chỉnh sửa phim thành công", movie: currentMovie });
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
    for (let genre of _movie.genres) {
      const existingGenre = await Genre.findById(genre);
      if (!existingGenre) {
        const error = new Error("Thể loại không tồn tại");
        error.statusCode = 406;
        return next(error);
      }
      existingGenre.movies.pull(_movie._id.toString());
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
    await Movie.findByIdAndRemove(movieId)
    res.status(200).json({ message: "Xoá phim thành công" });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find().populate("genres").populate("actors");

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
    const _movie = await Movie.findOne({slug: movieSlug}).populate("genres").populate("actors");
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
