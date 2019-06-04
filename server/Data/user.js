const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

var Userschema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Field Necessary"],
    minlength: 4
  },
  email: {
    type: String,
    required: [true, "Field Necessary"],
    trim: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  phone:{
    type:number,
    required=true
  },
  password: {
    type: String,
    required: [true, "Field Necessary"],
    minlength: 8
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

Userschema.methods.generateAuthToken = function() {
  var user = this;
  var access = "auth";
  var token = jwt
    .sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET)
    .toString();
  user.tokens.push({ access, token });
  return user.save().then(() => {
    return token;
  });
};

Userschema.methods.removeToken = function(token) {
  var user = this;
  return user.update({
    $pull: {
      tokens: { token }
    }
  });
};

Userschema.statics.findByToken = function(token) {
  var user = this;
  var decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }
  return user.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

Userschema.pre('save',function(next){
    var user=this;
    if(user.isModified('password')){
      bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(user.password,salt,(err,hash)=>{
          user.password=hash;
          next();
        })
      })
    }else{
      next();
    }
  });

  var User=mongoose.model('User',Userschema);
  module.exports={
    User
  };
  