const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNo: String,
    name: String,
    rollNo: String,
    status: String,
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
    checkInDate: { type: Date },
    checkOutDate: { type: Date }
    });

// Remove the useDb and DB.model lines
// const DB = mongoose.connection.useDb("Hostel_DB");
// const Room = DB.model('Room', roomSchema);

// Register the model using mongoose.model
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;