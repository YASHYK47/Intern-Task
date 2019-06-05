const express = require("express");
const router = express.Router();
const _ = require("lodash");
const { ObjectID } = require("mongodb");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");

var { mongoose } = require("./../db/mongoose.js");
var { User } = require("./../Data/user.js");
var { Meeting } = require("./../Data/meeting.js");

var { authenticate } = require("./../middleware/authenticate.js");
sgMail.setApiKey(
  process.env.sendgridAPI
);

// Create a new meeting
router.post("/addmeeting", authenticate, (req, res) => {
  var sender = req.user;
  var receivers = req.body.receivers;

  var body = {};
  body.senderId = sender._id;
  body.topic = req.body.topic;
  body.time = req.body.schedule;
  body.receivers = [];
  meeting = new Meeting(body);
  meeting.save().then(meeting => {
    res.status(200).json({ msg: "Meeting Added" });
  });
});

//Adding participants in meeting 
router.post("/addparticipant", authenticate, (req, res) => {
  var meetingId = req.body.meetingId;
  var receiverId = req.body.receiverId;
  var item = { id: receiverId, status: "sent" };
  Meeting.update({ _id: meetingId }, { $push: { item } }).then(function(err) { //updating list of participants in a meeting
    if (err) {
      return res.status(500).send({ msg: err.message });
    }
    res.status(200).json({ msg: "Request sent successfully" });
  });
});

router.get("/meeting/:id", authenticate, (req, res) => {
  Meeting.findOne({ _id: req.params.id }).then(meeting => {
    var now = new Date();
    meeting.time = meeting.time - now.getTimezoneOffset() * 60000; //converting to local timezone
    res.status(200).send(meeting);
    // var gmtDateTime=meeting.time;
    // var local = gmtDateTime.local().format('YYYY-MMM-DD h:mm A');
    // console.log(local);
  });
});

//Accepting invitation
router.put("/accept/meeting/invitation", authenticate, (req, res) => {
  var meetingId = req.body.meetingId;
  Meeting.update(
    { "receivers.id": meetingId },
    {
      $set: {
        "receivers.$.status": "accepted"
      }
    }
  );
});

//Rejecting Invitation
router.put("/reject/meeting/invitation", authenticate, (req, res) => {
  var meetingId = req.body.meetingId;
  Meeting.update(
    { "receivers.id": meetingId },
    {
      $set: {
        "receivers.$.status": "rejected"
      }
    }
  );
});

//Get All Previous Meetings
router.post("/get/meetings/previous", authenticate, (req, res) => {
  Meetings.findAll({ //finding list of meetings where user is sender or organizer
    $and: [{ "sender.id": req.user._id }, { time: { $lte: Now() } }]
  }).then(meetings => {
    Meetings.findAll({//finding list of meetings where user is receiver
      $and: [{ "receivers.id": req.user._id }, { time: { $lte: Now() } }]
    }).then(meetings1 => {
      meetings.concat(meetings1); // concatenating both results
      if (!meetings) {  //if no meeting
        res.status(404).json({ msg: "No meetings found" });
      }
      res.status(200).send(meetings);
    });
  });
});

module.exports = router;  //exporting Router
