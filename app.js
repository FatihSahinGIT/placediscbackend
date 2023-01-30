const express = require("express");
const bodyParser = require("body-parser");

// Route Import
const placesRoutes = require("./routes/places");
const usersRoutes = require("./routes/users");

// HTTP Error Import
const HTTPError = require("./models/http-error");

// Mongoose Import
const mongoose = require("mongoose");

const app = express();

const fs = require("fs");

const path = require("path");

app.use(bodyParser.json());

// cors management
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// access images
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(express.static(path.join("public")));

app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// error handling
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (error) => {});
  }
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "Unbekannter Fehler" });
});

// mongoose
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.ivpev.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log(process.env.DB_NAME, process.env.DB_USER, process.env.JWT_KEY, process.env.PORT);
    console.log("Datenbank verbunden!");
    app.listen(process.env.PORT);
  })
  .catch((error) => {
    throw new HTTPError("Datenbank Verbindung fehlgeschlagen!", error);
  });
