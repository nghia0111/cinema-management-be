const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomTypeSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    prices: [
        {
            start: String,
            price: Number,
            require: true
        }
    ]
})

module.exports = mongoose.model("RoomType", roomTypeSchema);