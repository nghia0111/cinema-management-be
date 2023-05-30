const { validationResult } = require("express-validator");
const Movie = require("../models/movie");
const Actor = require("../models/actor");

const { getRole } = require("../utils/service");
const { userRoles } = require("../constants");

exports.createActor = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const { name, birthday, nation, story, avatar, images } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được thêm diễn viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const actor = new Actor({
      name,
      birthday,
      nation,
      story,
      avatar,
      images,
    });
    await actor.save();

    const actors = await Actor.find().populate("movies", "name thumbnail slug");

    res
      .status(201)
      .json({ message: "Thêm diễn viên thành công", actors: actors });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.updateActor = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    error.validationErrors = errors.array();
    return next(error);
  }

  const actorId = req.params.actorId;

  const { name, birthday, nation, story, avatar, images } = req.body;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được chỉnh sửa diễn viên"
      );
      error.statusCode = 401;
      return next(error);
    }

    const currentActor = await Actor.findById(actorId);
    if (!currentActor) {
      const err = new Error("Không tìm thấy diễn viên");
      err.statusCode = 406;
      next(err);
    }

    currentActor.name = name;
    currentActor.birthday = birthday;
    currentActor.nation = nation;
    currentActor.story = story;
    currentActor.avatar = avatar;
    currentActor.images = images;
    await currentActor.save();

    const actors = await Actor.find().populate("movies", "name thumbnail slug");
    res
      .status(200)
      .json({ message: "Chỉnh sửa diễn viên thành công", actors: actors });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.deleteActor = async (req, res, next) => {
  const actorId = req.params.actorId;
  try {
    const role = await getRole(req.accountId);
    if (
      role != userRoles.STAFF &&
      role != userRoles.MANAGER &&
      role != userRoles.OWNER
    ) {
      const error = new Error(
        "Chỉ có quản lý, nhân viên hoặc chủ rạp mới được xóa diễn viên"
      );
      error.statusCode = 401;
      return next(error);
    }
    const _actor = await Actor.findById(actorId);
    if (!_actor) {
      const error = new Error("Diễn viên không tồn tại");
      error.statusCode = 406;
      return next(error);
    }
    for (let movie of _actor.movies) {
      const existingMovie = await Movie.findById(movie);
      if (!existingMovie) {
        const error = new Error("Phim không tồn tại");
        error.statusCode = 406;
        return next(error);
      }
      existingMovie.actors.pull(actorId);
    }
    await Actor.findByIdAndRemove(actorId);
    const actors = await Actor.find().populate("movies", "name thumbnail slug");
    res
      .status(200)
      .json({ message: "Xoá diễn viên thành công", actors: actors });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getActors = async (req, res, next) => {
  try {
    const actors = await Actor.find().populate("movies", "name thumbnail slug");

    res.status(200).json({ actors });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};

exports.getActorBySlug = async (req, res, next) => {
  const actorSlug = req.params.actorSlug;
  try {
    let actor = await Actor.findOne({ slug: actorSlug }).populate(
      "movies",
      "name thumbnail slug"
    );
    if (!actor) {
      const error = new Error("Diễn viên không tồn tại");
      error.statusCode = 406;
      return next(error);
    }

    res.status(200).json({ actor });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};