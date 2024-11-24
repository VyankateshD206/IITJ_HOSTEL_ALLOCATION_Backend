const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalRooms: { type: Number, required: true },
  availableRooms: { type: Number, required: true },
  image: String
});

// Remove the useDb and DB.model lines
// const DB = mongoose.connection.useDb("Hostel_DB");
// const Hostel = DB.model('Hostel', hostelSchema);

// Register the model using mongoose.model
const Hostel = mongoose.model('Hostel', hostelSchema);

module.exports = Hostel;