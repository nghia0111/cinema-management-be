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
  date.setDate(date.getDate() + 1);
  date.setHours(0,0,0,0);
  date.setHours(date.getHours() + 7);
  return date;
};
