const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const actorController = require("../controllers/actor");
const isAuth = require("../middlewares/is-auth");

const actorValidation = [
  body("name", "Vui lòng cung cấp tên diễn viên").trim().notEmpty(),
  body("birthday", "Ngày sinh không hợp lệ").isISO8601().toDate(),
  body("nation", "Vui lòng cung cấp quốc tịch").trim().notEmpty(),
  body("story", "Vui lòng cung cấp mô tả chi tiết").trim().notEmpty(),
  body("avatar", "Vui lòng cung cấp ảnh đại diện").trim().notEmpty(),
];

router.get("/", actorController.getActors);

router.get("/:actorSlug", actorController.getActorBySlug);

router.post("/", isAuth, actorValidation, actorController.createActor);

router.put(
  "/:actorId",
  isAuth,
  actorValidation,
  actorController.updateActor
);

router.delete("/:actorId", isAuth, actorController.deleteActor);

module.exports = router;
