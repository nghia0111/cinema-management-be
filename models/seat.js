const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { seatTypes } = require("../constants");

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
      return (
        String.fromCharCode(65 + this.rowIndex) +
        (this.columnIndex + 1).toString()
      );
    },
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    require: true,
  },
  type: {
    type: String,
    enum: seatTypes,
    require: true,
  },
});

module.exports = mongoose.model("Seat", seatSchema);
