const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const seatSchema = new Schema({
  columnIndex: {
    type: String,
    require: true,
  },
  rowIndex: {
    type: String,
    require: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    require: true,
  },
});

module.exports = mongoose.model("Seat", seatSchema);
