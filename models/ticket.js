const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketSchema = new Schema({
  showTime: {
    type: Schema.Types.ObjectId,
    ref: "ShowTime",
    require: true,
  },
  seat: {
    type: Schema.Types.ObjectId,
    ref: "Seat",
    require: true,
  },
  price: {
    type: Number,
    require: true,
  },
  booked: {
    type: Boolean,
    require: true,
    default: false
  }
}, {timestamps: true});

module.exports = mongoose.model("Ticket", ticketSchema);
