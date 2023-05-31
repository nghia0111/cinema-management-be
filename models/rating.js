const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ratingSchema = new Schema(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    score: {
      type: Number,
      require: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", ratingSchema);
