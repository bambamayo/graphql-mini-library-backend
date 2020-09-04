const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  password: { type: String, required: true, minLength: 6 },
  favoriteGenre: { type: String, required: true },
  books: [{ type: mongoose.Types.ObjectId, default: [], ref: "Book" }],
});

userSchema.plugin(uniqueValidator);

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
  },
});

module.exports = mongoose.model("User", userSchema);
