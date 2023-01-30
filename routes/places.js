// Router -> lets you define routes and export them
const express = require("express");
const router = express.Router();

// validor
const { check } = require("express-validator");

const placesControllers = require("../controllers/places");

const fileUpload = require("../middleware/file-upload");

const tokenAuth = require("../middleware/check-auth");

// MIDDLEWARE -> Order does matter!

// get place by place id
router.get("/:pid", placesControllers.getPlaceByID);

// get place by place userid#
router.get("/user/:uid", placesControllers.getPlacesByUserID);

// token check
router.use(tokenAuth);

// post & check
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

// patch & check
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

// delete
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
