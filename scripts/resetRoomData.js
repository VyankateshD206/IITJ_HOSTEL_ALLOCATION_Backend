const mongoose = require('mongoose');
const Room = require('../models/RoomData');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetRoomData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Clear all existing rooms
    await Room.deleteMany({});
    console.log('Cleared all existing rooms');

    // Your hostel ID - make sure this matches an existing hostel in your database
    const hostelId = '67042083c4fc139bb62809a2';

    // Create 50 rooms for this hostel
    const roomsToAdd = [];
    for (let i = 1; i <= 50; i++) {
      const roomNo = i < 10 ? `10${i}` : `1${i}`; // Creates room numbers 101-150
      const status = i % 3 === 0 ? 'occupied' : 'available'; // Makes every third room occupied
      
      const room = {
        roomNo,
        name: status === 'occupied' ? `Student ${i}` : '',
        rollNo: status === 'occupied' ? `B23CS${1200 + i}` : '',
        status,
        hostel: hostelId
      };
      roomsToAdd.push(room);
    }

    // Insert the new rooms
    const result = await Room.insertMany(roomsToAdd);
    console.log(`Added ${result.length} new rooms for hostel ${hostelId}`);

    // Verify the data
    const count = await Room.countDocuments();
    console.log(`Total rooms in database: ${count}`);
    
    const sampleRoom = await Room.findOne();
    console.log('Sample room:', sampleRoom);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

resetRoomData();