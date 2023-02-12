const User = require("../models/user");

exports.getRole = async (accountId) => {
  const existingUser = await User.findOne({ account: accountId });
  if (existingUser) {
    return existingUser.role;
  }
};
