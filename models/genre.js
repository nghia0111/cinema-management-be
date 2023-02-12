const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const genreSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    movies: [{type: Schema.Types.ObjectId, require: true}]
})

module.exports = mongoose.model("Genre", genreSchema);