const express = require("express");     //package express
const router = express.Router();
const _ = require("lodash");
const { ObjectID } = require("mongodb");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");       //sendgrid API for mailing

var { mongoose } = require("./../db/mongoose.js");
var { User } = require("./../Data/user.js");

var { authenticate } = require("./../middleware/authenticate.js");  //authenticate user
sgMail.setApiKey(
process.env.sendgridAPI
);

//Signup route
router.post("/signup", (req, res) => {                                             
  var body = _.pick(req.body, ["email", "name", "country", "password"]);
  var email = req.body.email;
// Checking if email is already in use
  User.findOne({ email: email }, function(err, user) {
    if (user)
      return res
        .status(400)
        .send({
          msg:
            "The email address you have entered is already associated with another account."
        });
    user = new User(body);
    user
      .save()
      .then(() => {
        return user.generateAuthToken();
      })
      .then(token => {
        if (err) {
          return res.status(500).send({ msg: err.message });
        }
        const msg = {
          to: user.email,
          from: "'no-reply@Scheduler.com",
          subject: "Account Verification Token",
          text:
            "Hello,\n\n" +
            "Please verify your account by clicking the link: \nhttp://" +
            req.headers.host +
            "/confirmation/" +
            token +
            ".\n"
        };
        // Sending Email
        sgMail
          .send(msg)
          .then(result => {
            res.status(200).send("We have sent you an email for verification");
          })
          .catch(err => {
            console.log(err);
          });
      });
  });
});


//Email Confirmation
router.post("/confirmation/:token", (req, res) => {
  var token = req.params.token;
  User.findByToken(token).then(user => {
    if (!user) {
      res
        .status(400)
        .send({
          type: "not-verified",
          msg:
            "We were unable to find a valid token. Your token my have expired."
        });
    }
    if (user.isVerified)
      return res
        .status(400)
        .send({
          // checking if the user is already verified
          type: "already-verified",
          msg: "This user has already been verified."
        });
    User.update({ _id: user._id }, { isVerified: true }).then(function(err) {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }
      res.status(200).send("The account has been verified. Please log in.");
    });
  });
});

// Login Route
router.post("/login", (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email }).then(user => {
    if (!user) {
      res.status(404).send("No user Found");
    }
    if (!user.isVerified) {
      res.status(400).json({ msg: "You must verify your email first" });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
// Generating Token if correct password
        user
          .generateAuthToken()
          .then(token => {
            res.header("x-auth", token).send(user);
          })
          .catch(e => {
            res.status(401).send(e);
          });
      } else {
        res.status(400).send("wrong password");
      }
    });
  });
});

//Send Invitation Route
router.post("/invite", authenticate, (req, res) => {
  var email = req.body.email;
// composing email
  const msg = {
    to: email,
    from: "'no-reply@Scheduler.com",
    subject: "Invitation to Join",
    text:
      "Hello,\n\n" +
      req.user.name +
      "has invited you to join Universal Scheduler,you can do so by clicking the link: \nhttp://" +
      req.headers.host +
      "/signup/"
  };
  // Sending Email
  sgMail
    .send(msg)
    .then(result => {
      res.status(200).send("Invitation sent");
    })
    .catch(err => {
      console.log(err);
    });
});

// Get Profile Route
router.get("/profile/:id", authenticate, (req, res) => {
  var id = req.params.id;
  User.findOne({ _id: id }).then(user => {
    if (!user) {
      res.status(404).json({ msg: "No user Found" });
    }
    user1 = _.pick(user, ["email", "name", "country"]); //Giving only necessary Fields
    res.status(200).send(user1);
  });
});

//Get my Profile route
router.get("/myprofile", authenticate, (req, res) => {
  res.status(200).send(req.user); 
});

// Logging-Out route
router.delete("/logout", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(           //Removing Token
    () => {
      res.status(200).json({ msg: "Logged Out Successfully" });
    },
    () => {
      res.status(400).send();
    }
  );
});

module.exports = router; //Export Router
