// Router -> lets you define routes and export them
const express = require("express");
const router = express.Router();

const { check } = require("express-validator");

const usersController = require("../controllers/users");

const fileUpload = require("../middleware/file-upload");

// MIDDLEWARE -> Order does matter!

// default route
router.get("/", usersController.getUsers);

// signup
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("username").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

// login
router.post("/login", usersController.login);

module.exports = router;
