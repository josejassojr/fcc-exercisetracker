// Requirements and Basic Configuration

const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
require("dotenv").config({ path: "file.env" });

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

// urlencoding? 
var func = bodyParser.urlencoded({ extended: false });
app.use(func);

// Configuration of MongoDB/Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  _id: { type: String, required: true }
});

const user = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  userID: { type: String, required: true },
  date: { type: String, required: true },
  duration: { type: Number, required: true},
  description: { type: String, required: true }
});

const exercise = mongoose.model("Exercise", exerciseSchema);

// ROUTE METHODS

// POST request to /api/users sends user document to database w properties: _id, username
app.post("/api/users", function (req, res) {
  let newID = String(new mongoose.Types.ObjectId());
  console.log("new _id is: " + newID);
  console.log("username is: " + req.body.username);
  let newUsername = req.body.username;
  let createdUser = new user();
  createdUser._id = newID;
  createdUser.username = newUsername;
  createdUser.save(function handleSaveUser(err, data) {
    if (err) {
      console.log(err);
      console.error("error in creating and saving new user");
      return res.json({ error: "could not create user" });
    } else {
      console.log(data);
      return res.json({
        username: newUsername,
        _id: newID
      });
    }
  });
});

// A GET request to /api/users responds with an array of all users w their _id and username properties
app.get("/api/users", function (req, res) {
  user.find(function (err, data) {
    if (err) {
      console.log(err) 
      return res.json({ error: "error in retrieving all users" });
    } else {
      console.log(data)
      const allUsers = data.map(user => (
        { _id: user._id, username: user.username }));
      return res.send(allUsers);
    }
  })
});

// POST request to /api/user/:id/exercises sends exercise document to DB with properties: _id, date, duration, and description
app.post("/api/users/:_id/exercises", function (req, res) {
  let createdExercise = new exercise();
  createdExercise.userID = req.params._id;
  createdExercise.date = convertToDateString(req.body.date);
  createdExercise.duration = req.body.duration;
  createdExercise.description = req.body.description;
  createdExercise.save(function handleSaveExercise(err, data) {
    if (err) {
      console.log(err);
      console.error("error in creating and saving new exercise");
      return res.json({ error: "could not save exercise" });
    } else {
      console.log(data);
      return res.json({
        _id: data.userID,
        date: data.date,
        duration: data.duration,
        description: data.description
      });
    }
  })
});

// OTHER FUNCTIONS

// Converts given input into proper String representing the date to be for use in saving exercises to database
function convertToDateString(input) {
  let date;
  if (input == null || input == "") {
    date = new Date();
  } else {
    date = new Date(input);
  }
  utc_date = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  ];
  return new Date(utc_date).toDateString();
}

// Tests for convertToDateString()
// console.log(convertToDateString("12/12"));
// console.log(convertToDateString("12/12/1244"));
// // console.log(convertToDateString("12/2021")); INVALID DATE
// console.log(convertToDateString("12-12/2021"));
// console.log(convertToDateString("12-12-2021"));
// console.log(convertToDateString("12-12"));
// console.log(convertToDateString("2020-10-29"));
// console.log(convertToDateString("2021"));
// console.log(convertToDateString());
// console.log(convertToDateString("")); 

