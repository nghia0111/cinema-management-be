const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const movieSchemma = new Schema({
  name: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  genres: [
    {
      type: Schema.Types.ObjectId,
      ref: "Genre",
      require: true,
    },
  ],
  actors: [
    {
      type: Schema.Types.ObjectId,
      ref: "Actor",
      require: true,
    },
  ],
  director: {
    type: String,
    require: true,
  },
  thumbnail: {
    type: String,
    require: true,
  },
  images: [
    {
      type: String,
      require: true,
    },
  ],
  time: {
    type: Number,
    require: true,
  },
  premiereDay: {
    type: Date,
    require: true,
  },
  endDay: {
    type: Date,
    require: true,
  },
  language: {
    type: String,
    require: true,
  },
  slug: {
    type: String,
    slug: "name",
    unique: true,
  },
  trailer: {
    type: String,
    require: true,
  }
});

module.exports = mongoose.model("Movie", movieSchemma);
