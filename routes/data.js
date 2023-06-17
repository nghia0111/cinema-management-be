const express = require("express");
const router = express.Router();

const dataController = require("../controllers/data");

router.get("/actor-nations", dataController.getActorNations);

router.get("/nations", dataController.getNations);

module.exports = router;
