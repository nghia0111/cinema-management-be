const User = require("../models/user");

exports.getRole = async (accountId) => {
  const existingUser = await User.findOne({ account: accountId });
  if (existingUser) {
    return existingUser.role;
  }
};

exports.getLocalDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 7);
  return date;
}

exports.getNextDate = (date = this.getLocalDate()) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + 1);
  copy.setHours(0,0,0,0);
  copy.setHours(copy.getHours() + 7);
  return copy;
};
