const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const genreSchema = new Schema({
    name: {
        type: String,
        require: true
    },
})

module.exports = mongoose.model("Genre", genreSchema);