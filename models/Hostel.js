const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: String,
  totalRooms: Number,
  availableRooms: Number,
  image: String
});

const DB = mongoose.connection.useDb("Hostel_DB")
const Hostel =  DB.model('Hostel', hostelSchema);
// const Hostel =  mongoose.connection.model('Hostel', hostelSchema);


module.exports = Hostel;