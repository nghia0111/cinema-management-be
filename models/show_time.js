const mongoose = require("mongoose");
const Movie = require("./movie");
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
      const start = new Date(startTime);
      return start.setMinutes(start.getMinutes() + duration);
    },
  },
  tickets: [
    [
      {
        ticketId: {
          type: Schema.Types.ObjectId,
          ref: "Ticket",
          require: true,
        },
        isBooked: {
          type: Boolean,
          require: true
        },
      },
    ],
  ],
});

module.exports = mongoose.model("ShowTime", showTimeSchema);
