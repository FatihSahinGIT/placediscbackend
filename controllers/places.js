const HTTPError = require("../models/http-error");
const getCoordinatesForAddress = require("../util/location");

// mongoose
const mongoose = require("mongoose");
const Place = require("../models/place");

// validator
const { validationResult } = require("express-validator");

const fs = require("fs");

// user
const User = require("../models/user");

const getPlaceByID = async (req, res, next) => {
  const placeID = req.params.pid;

  let place;

  // Find depending on placeID via mongoose
  try {
    place = await Place.findById(placeID);
  } catch (err) {
    const error = new HTTPError("Orte konnten nicht geladen werden", 500);
    return next(error);
  }

  if (!place) {
    const error = new HTTPError("Kein Nutzer finden können.");
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserID = async (req, res, next) => {
  const userID = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userID });
  } catch (err) {
    const error = new HTTPError(
      "Kein Orte bezüglich des Erstellers gefunden",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(new HTTPError("Kein Ort unter dem Nutzer gefunden!", 404));
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    next(new HTTPError("Ungütlige Eingaben", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (error) {
    next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    creator,
    image: req.file.path,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(new HTTPError("Erstellung eines Ortes fehlgeschlagen!", 500));
  }

  if (!user) {
    return next(new HTTPError("Nutzer nicht gefunden (ID nicht korrekt)", 404));
  }

  // add place to mongodb with unique id
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.place.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HTTPError("Erstellen eines Ortes fehlgeschlagen!", 500);
    return next(error);
  }

  // success added
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    return next(new HTTPError("Ungütlige Eingaben", 422));
  }

  const { title, description } = req.body;
  const placeID = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeID);
  } catch (err) {
    const error = new HTTPError("Ort nicht aktualisiert!", 500);
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userID) {
    const error = new HTTPError("Du bist nicht berechtig, dies zu tun!", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HTTPError("Ort nicht aktualisiert!", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeID = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeID).populate("creator");
  } catch (err) {
    const error = new HTTPError("Ort konnte nich gelöscht werden", 500);
    return next(error);
  }

  if (!place) {
    return next(new HTTPError("Kein Ort für den Nutzer finden können!", 404));
  }

  if (place.creator.id !== req.userData.userID) {
    const error = new HTTPError("Du bist nicht berechtig, dies zu tun!", 401);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await place.remove({ session: sess });
    place.creator.place.pull(place);

    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HTTPError("Ort konnte nich gelöscht werden", 500);
    return next(error);
  }

  // delete img
  const image = place.image;
  fs.unlink(image, (err) => {});

  res.status(200).json({ message: "Ort gelöscht!" });
};

exports.getPlaceByID = getPlaceByID;
exports.getPlacesByUserID = getPlacesByUserID;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
