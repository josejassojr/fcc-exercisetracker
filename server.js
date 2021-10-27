// Requirements and Basic Configuration

const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
require("dotenv").config({ path: "sample.env" });

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

// POST request to /api/users/:id/exercises sends exercise document to DB with properties: _id, date, duration, and description
app.post("/api/users/:_id/exercises", function (req, res) {
  console.log(req.body);
  console.log(req.params._id);
  if (req.body.description === "") {
    return res.send("'Description' is required.")
  } else if (req.body.duration === "") {
    return res.send("'Duration' is required.")
  }
  user.findById(req.params._id, function handleFindUser(err, data) {
    if (err) {
      console.log(err);
      console.log("Error Finding User by ID");
      return res.send("Error Finding User by ID");
    } else if (data === null) { // did not find User with that ID
      return res.send("Unknown UserID");
    } else { // User found. Proceed to save Exercise.
      let createdExercise = new exercise();
      createdExercise.userID = req.params._id;
      createdExercise.date = convertToDateString(req.body.date);
      createdExercise.duration = req.body.duration;
      createdExercise.description = req.body.description;
      const foundUsername = data.username;
      createdExercise.save(function handleSaveExercise(err, data) {
        if (err) {
          console.log(err);
          console.log("error in creating and saving new exercise");
          return res.json({ error: "could not save exercise" });
        } else {
          console.log(data);
          return res.json({
            _id: data.userID,
            username: foundUsername,
            date: data.date,
            duration: data.duration,
            description: data.description
          });
        }
      })
    }
  });
});

// If no _id is input to post exercise.
app.post("/api/users//exercises", function (req, res) {
  res.send("need ID");
})

// GET request to /api/users/:id/logs responds with user and log of all user's exercises
app.get("/api/users/:_id/logs?[from][&to][&limit]", function(req, res) {
  console.log(req.params);
  console.log(req.params._id);
  user.findById(req.params._id, function handleFindUserForLogs(err, data) {
    if (err) {
      console.log(err);
      console.log("Error finding user by ID");
      return res.send("Error Finding User");
    } else if (data === null) {
      console.log("No user found with this ID");
      return res.send("No User found with ID: " + req.params._id);
    } else {
      const foundUsername = data.username;
      const foundUserID = data._id;
      exercise.find({ userID: foundUserID }, function handleFoundExerciseLog(
        err,
        data
      ) {
        if (err) {
          console.log(err);
          console.log("Error in finding Exercise Log");
          return res.send("Error in finding Exercise Log");
        } else {
          const exerciseLog = data.map(exer => ({
            description: exer.description,
            duration: exer.duration,
            date: exer.date
          }));
          const logCount = exerciseLog.length;
          return res.json({
            _id: foundUserID,
            username: foundUsername,
            count: logCount,
            log: exerciseLog
          });
        }
      });
    }
  });
});

// // GET request to /api/users/:_id/logs?[from][&to][&limit] responds with user and log of user's exercises within dates and set to limited number
// app.get("/api/users/:_id/logs?[from][&to][&limit]", function (req, res) {
//   console.log(req.params);
//   res.send("Hello");
// });

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

