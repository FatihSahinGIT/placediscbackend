const jwt = require("jsonwebtoken");
const HTTPError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: "Bearer TOKEN";
    if (!token) {
      throw new Error("Auth fehlgeschlagen!");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = {
      userID: decodedToken.userID,
    };
    next();
  } catch (err) {
    return next(
      new HTTPError("Authentifizierung fehlgeschlagen (no jwt token)", 401)
    );
  }
};
