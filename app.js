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
    `mongodb+srv://fasa:03ksfO4vpX6jneqW@cluster0.ivpev.mongodb.net/placediscprod?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Datenbank verbunden!");
    app.listen(2000);
  })
  .catch((error) => {
    throw new HTTPError("Datenbank Verbindung fehlgeschlagen!", error);
  });
