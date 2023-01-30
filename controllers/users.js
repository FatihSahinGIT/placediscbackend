const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validationResult } = require("express-validator");

const HTTPError = require("../models/http-error");

const User = require("../models/user");

const getUsers = async (req, res, next) => {
  // all users but without password
  let allUsers;

  try {
    allUsers = await User.find({}, "-password");
  } catch (err) {
    const error = new HTTPError("Nutzer nicht auflistbar!", 500);
    return next(error);
  }

  res.json({ users: allUsers.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    return next(new HTTPError("Ungültige Eingaben", 422));
  }

  const { username, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HTTPError("Registrierung fehlgeschlagen", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HTTPError("Nutzer exisitiert bereits!", 422);
    return next(error);
  }

  // hash password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HTTPError("Nutzer konnte nicht erstellt werden!", 500));
  }

  const createdUser = new User({
    username,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HTTPError("Registrierung fehlgeschlagen!", 500);
    return next(error);
  }

  // jwt token creation
  let token;
  try {
    token = jwt.sign(
      { userID: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HTTPError("Registrierung fehlgeschlagen! (JWT)", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userID: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HTTPError("Anmeldung fehlgeschlagen", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HTTPError("Anmeldung ist fehgeschlagen!", 422);
    return next(error);
  }

  let validPassword = false;
  try {
    validPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HTTPError("Anmeldung fehlgeschlagen!", 500));
  }

  if (!validPassword) {
    return next(new HTTPError("Anmeldung fehlgeschlagen!", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userID: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HTTPError("Anmeldung fehlgeschlagen! (JWT)", 500);
    return next(error);
  }

  res.json({
    userID: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
