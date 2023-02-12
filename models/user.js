const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { userRoles} = require("../constants");

const userSchema = new Schema({
  role: {
    type: String,
    enum: userRoles,
    required: true,
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  status: {
    type: String
  },
});

module.exports = mongoose.model("User", userSchema);
