require("./config/config.js");
const express = require("express");

var app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
const port = process.env.PORT || 3000;
const  userRoutes = require("./routes/user-routes.js");
const meetingRoutes = require("./routes/meeting-routes.js");

app.use("/",userRoutes);
app.use("/",meetingRoutes)

app.listen(port, () => {
  console.log(`Started up at port:${port}`);
});
module.exports = {
  app
};
