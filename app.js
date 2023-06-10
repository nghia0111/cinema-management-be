const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movie");
const userRoutes = require("./routes/user");
const genreRoutes = require("./routes/genre");
const roomTypeRoutes = require("./routes/room_type");
const actorRoutes = require("./routes/actor");
const itemRoutes = require("./routes/item");
const roomRoutes = require("./routes/room");
const imageRoutes = require("./routes/image");
const postRoutes = require("./routes/post");
const showTimeRoutes = require("./routes/show_time");
const transactionRoutes = require("./routes/transaction");
const commentRoutes = require("./routes/comment");
const ratingRoutes = require("./routes/rating");
const reportRoutes = require("./routes/report")

app.use("/auth", authRoutes);
app.use(movieRoutes);
app.use(userRoutes);
app.use(genreRoutes);
app.use(roomTypeRoutes);
app.use(actorRoutes);
app.use(itemRoutes);
app.use(roomRoutes);
app.use(imageRoutes);
app.use(postRoutes);
app.use(showTimeRoutes);
app.use(transactionRoutes);
app.use(commentRoutes);
app.use(ratingRoutes);
app.use(reportRoutes)
app.use(helmet());
app.use(compression());

app.use((err, req, res, next) => {
  const { statusCode, message, data, validationErrors } = err;
  res.status(statusCode || 500).json({ message, data, validationErrors });
});

mongoose.set("strictQuery", false);
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.zzngyvy.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
  )
  .then((result) => {
    app.listen(process.env.PORT || 3002);
  })
  .catch((err) => {
    console.log(err);
  });
