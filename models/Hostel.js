const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalRooms: { type: Number, required: true },
  availableRooms: { type: Number, required: true },
  image: String
});

const DB = mongoose.connection.useDb("Hostel_DB")
const Hostel =  DB.model('Hostel', hostelSchema);
// const Hostel =  mongoose.connection.model('Hostel', hostelSchema);


module.exports = Hostel;