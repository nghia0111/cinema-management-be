const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showTimeSchema = new Schema({
  startTime: {
    type: Date,
    require: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    require: true,
  },
  movie: {
    type: Schema.Types.ObjectId,
    ref: "Movie",
    require: true,
  },
  duration: {
    type: Number,
    require: true,
  },
  endTime: {
    type: Date,
    default: function () {
      const start = new Date(this.startTime);
      return start.setMinutes(start.getMinutes() + this.duration);
    },
  },
  singlePrice: {
    type: Number,
    require: true,
  },
  doublePrice: {
    type: Number,
    require: true,
  },
  tickets: [
    [
      {
        ticketId: {
          type: Schema.Types.ObjectId,
          ref: "Ticket",
        }
      },
    ],
  ],
});

module.exports = mongoose.model("ShowTime", showTimeSchema);
