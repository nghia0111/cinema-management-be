const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  roomType: {
    type: Schema.Types.ObjectId,
    ref: "RoomType",
    require: true
  },
  seats: {
    type: Schema.Types.ObjectId,
    ref: "Seat",
    require: true
  }
});

module.exports = mongoose.model("Room", roomSchema);