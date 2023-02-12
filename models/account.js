const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    username: {
        type: String,
        require: true
    }, 
    password: {
        type: String,
        require: true
    },
    resetToken: String,
    resetTokenExpiration: Date
});

module.exports = mongoose.model("Account", accountSchema);
