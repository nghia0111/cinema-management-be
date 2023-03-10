const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { roomStatus } = require("../constants")

const roomSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  roomType: {
    type: Schema.Types.ObjectId,
    ref: "RoomType",
    require: true,
  },
  seats: [[{
    type: Schema.Types.ObjectId,
    ref: "Seat",
  }]],
  status: {
    type: String,
    enum: roomStatus,
    default: roomStatus.ACTIVE
  }
});

module.exports = mongoose.model("Room", roomSchema);