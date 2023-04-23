const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const { postStatus } = require("../constants");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const postSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    thumbnail: {
      type: String,
      require: true,
    },
    content: {
      type: String,
      require: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    slug: {
      type: String,
      slug: "title",
      unique: true
    },
    view: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: postStatus,
      require: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);