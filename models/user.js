const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { userRoles, genders, userStatus} = require("../constants");

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
    enum: genders,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  avatar: {
    type: String
  },
  status: {
    type: String,
    enum: userStatus,
    default: userStatus.ACTIVE
  },
});

module.exports = mongoose.model("User", userSchema);
