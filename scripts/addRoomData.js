const mongoose = require('mongoose');
const Room = require('../models/RoomData');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Add this line to debug
console.log('MongoDB URL:', process.env.MONGO_URL);

async function addTestRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Add test rooms for a specific hostel
    const hostelId = '6727ad67cfce1a32cd0d9e45'; // Updated hostel ID
    const roomsToAdd = [];

    // Create 20 test rooms
    for (let i = 1; i <= 100; i++) {
      const roomNo = `${100 + i}`;
      const status = i % 2 === 0 ? 'available' : 'occupied';
      const room = {
        roomNo,
        name: status === 'occupied' ? `Student ${i}` : '',
        rollNo: status === 'occupied' ? `B23CS${1200 + i}` : '',
        status,
        hostel: hostelId
      };
      roomsToAdd.push(room);
    }

    // Insert the rooms
    const result = await Room.insertMany(roomsToAdd);
    console.log(`Added ${result.length} rooms successfully`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

addTestRooms();