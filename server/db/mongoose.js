const mongoose =require('mongoose');

mongoose.Promise=global.Promise;
mongoose.connect(process.env.MONGODB_URI||'mongo://localhost/rotten-potatoes');

module.exports={
  mongoose
};
