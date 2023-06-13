const Actor = require("../models/actor");

exports.getActorNations = async (req, res, next) => {
  try {
    const actors = await Actor.find();
    const nations = [];
    for (let actor of actors) {
      if (!nations.includes(actor.nation)) nations.push(actor.nation);
    }
    res.status(200).json({ nations });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
};
