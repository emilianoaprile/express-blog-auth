const express = require("express");
const router = express.Router();
const blogController = require("../controllers/BlogController.js");
const multer = require("multer");
const uploader = multer({dest: "public/imgs/posts/"});
const auth = require("../controllers/AuthController.js");



router.get("/", blogController.index);
// rotta per la creazione di un nuovo post + middleware per autenticazione
router.post("/create", uploader.single("image"), auth.authenticateJWT, auth.isAdmin, blogController.create);
router.get("/:slug/download", blogController.downloadImg);
router.get("/:slug", blogController.show);
router.delete("/:slug", blogController.destroy);

module.exports = router;