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

// urlencoding? 
var func = bodyParser.urlencoded({ extended: false });
app.use(func);

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


app.post("/api/users/:_id/exercises", function (req, res) {
  let createdExercise = new exercise();
  createdExercise.userID = req.params._id;
  createdExercise.date = req.body.date;
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

