const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showTimeSchema = new Schema({
  startTime: {
    type: String,
    require: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    require: true,
  },
  date: {
    type: Date,
    require: true
  },
  movie: {
    type: Schema.Types.ObjectId,
    ref: "Movie",
    require: true
  }
});

module.exports = mongoose.model("ShowTime", showTimeSchema);
