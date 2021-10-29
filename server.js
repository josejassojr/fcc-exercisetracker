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
  if (req.body.duration === "") {
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
      if (req.body.description[0] === "Other") {
        if (req.body.description[1] === "") {
          return res.send("Must include description if other");
        }
        createdExercise.description = req.body.description[1];
      } else {
        createdExercise.description = req.body.description[0];
      }
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
app.get("/api/users/:_id/logs", function(req, res) {
  console.log(req.params);
  console.log(req.params._id);
  console.log(req.query);
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
          let exerciseLog = data.map(exer => ({
            description: exer.description,
            duration: exer.duration,
            date: exer.date
          }));
          return res.json(paramsToFilteredLog(req.query.from, req.query.to, req.query.limit, exerciseLog, foundUsername, foundUserID));
        }
      });
    }
  });
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

// Returns Object from given Parameters: From Date, To Date, Limit, Log, username, userID
function paramsToFilteredLog(from, to, limit, log, username, userID) {
  let retLog = log
  // console.log(retLog);
  // console.log(new Date(from));
  // console.log(new Date(to));
  let x = "";
  if (new Date(from) != "Invalid Date") {
    x += "f"
    var retFrom = convertDateToUTCDate(new Date(from));
    retLog = retLog.filter(item => new Date(item.date) >= retFrom);
    // console.log(retLog);
  }
  if (new Date(to) != "Invalid Date") {
    x += "t"
    var retTo = convertDateToUTCDate(new Date(to));
    retLog = retLog.filter(item => new Date(item.date) <= retTo);
    // console.log(retLog);
  }
  if (limit !== undefined) {
    retLog = retLog.slice(0, limit);
    // console.log(retLog);
  }
  const logCount = retLog.length
  // console.log(x)
  switch (x) {
    case "f":
      return {
        _id: userID,
        username: username,
        from: retFrom.toDateString(),
        count: logCount,
        log: retLog
      };
    case "ft":
      return {
        _id: userID,
        username: username,
        from: retFrom.toDateString(),
        to: retTo.toDateString(),
        count: logCount,
        log: retLog
      };
    case 't':
      return {
        _id: userID,
        username: username,
        to: retTo.toDateString(),
        count: logCount,
        log: retLog
      };
    default:
      return {
        _id: userID,
        username: username,
        count: logCount,
        log: retLog
      };
  }
}

//  Converts Date to UTC Date
function convertDateToUTCDate(date) {
  utc_date = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  return new Date(utc_date);
}


// Tests

// function testParamsToFilteredLog() {
//   const startingLog = [
//     { description: "Testing", duration: 1, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 2, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 3, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 4, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 5, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 6, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 7, date: "Tue Oct 26 2021" },
//     { description: "Testing", duration: 8, date: "Sat Oct 23 2021" },
//     { description: "Testing", duration: 9, date: "Fri Oct 22 2021" },
//     { description: "Testing", duration: 10, date: "Thu Oct 21 2021" },
//     { description: "Testing", duration: 11, date: "Mon Mar 22 2021" },
//     { description: "Testing", duration: 12, date: "Mon Mar 22 2021" },
//     { description: "Testing", duration: 13, date: "Sun Oct 21 2001" },
//     { description: "Testing", duration: 14, date: "Sun Oct 21 2001" }
//   ];
//   console.log( 
//     paramsToFilteredLog( // Just From Date
//       "2021-10-21",
//       undefined,
//       undefined,
//       startingLog,
//       "jose",
//       "6172632df70de605622a9c83"
//     )
//   );
//   console.log(
//     paramsToFilteredLog( // From and To Date
//       "2021-10-21",
//       "2021-10-23",
//       undefined,
//       startingLog,
//       "jose",
//       "6172632df70de605622a9c83"
//     )
//   );
//   console.log(
//     paramsToFilteredLog( // Just To Date
//       undefined,
//       "2021-10-23",
//       undefined,
//       startingLog,
//       "jose",
//       "6172632df70de605622a9c83"
//     )
//   );
//   console.log(
//     paramsToFilteredLog( // All Three
//       "2021-10-21",
//       "2021-10-23",
//       1,
//       startingLog,
//       "jose",
//       "6172632df70de605622a9c83"
//     )
//   );
// }

// testParamsToFilteredLog();

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

