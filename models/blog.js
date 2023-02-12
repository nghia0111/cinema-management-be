const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const blogSchema = new Schema(
  {
    title: {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);