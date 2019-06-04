const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

var Meetingschema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  receivers: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId
      },
      status: {
        type: String
      }
    }
  ],
  time: {
    type: Date
  }
});

var Meeting = mongoose.model("Meeting", Meetingschema);
module.exports = {
  Meeting
};
