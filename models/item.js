const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  image: {
    imageUrl: {
      type: String,
      require: true,
    },
    imageId: {
      type: String,
      require: true,
    },
  },
  price: {
    type: Number,
    require: true,
  },
});

module.exports = mongoose.model("Item", itemSchema);
