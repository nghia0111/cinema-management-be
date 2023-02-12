const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const actorSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  birthday: {
    type: Date,
    require: true,
  },
  nation: {
    type: String,
    require: true,
  },
  movies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      require: true,
    },
  ],
  story: {
    type: String,
    require: true,
  },
  images: [
    {
      type: String,
      require: true,
    },
  ],
  slug: {
    type: String, 
    slug: "name",
    unique: true
  }
});

module.exports = mongoose.model("Actor", actorSchema);