const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// unique validator
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 3 },
  image: { type: String, required: true },
  // array -> multiple places for one user
  place: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
