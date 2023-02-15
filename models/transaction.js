const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tickets: [{
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      require: true,
    }],
    items: [
      {
        item: {
          type: Schema.Types.ObjectId,
          ref: "Item",
        },
        quantity: {
          type: Number,
        },
      },
    ],
    totalPrice: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
