const express = require("express");
const router = express.Router();

const dataController = require("../controllers/data");

router.get("/nations", dataController.getActorNations);

module.exports = router;
