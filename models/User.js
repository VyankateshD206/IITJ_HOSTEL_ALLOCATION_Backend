const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
  name: String,
  email: {type:String, unique:true},
  password: String,
});

// const DB = mongoose.connection.useDb("Hostel_DB")
// const UserModel =  DB.model('User', UserSchema);

const UserModel =  mongoose.model('User', UserSchema);

module.exports = UserModel;