const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const seatSchema = new Schema({
  columnIndex: {
    type: Number,
    require: true,
  },
  rowIndex: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
    default: function () {
        return String.fromCharCode('A'.charCodeAt() + columnIndex - 1) + rowIndex.toString();
      }
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    require: true,
  },
});

module.exports = mongoose.model("Seat", seatSchema);
