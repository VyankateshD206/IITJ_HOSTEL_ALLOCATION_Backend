const mongoose = require('mongoose');
const Room = require('../models/RoomData');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
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
    const hostelId = '6727ad67cfce1a32cd0d9e41';

    // New function to read CSV and insert data
    async function importRoomsFromCSV(filePath) {
      const roomsToAdd = [];
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            const room = {
              roomNo: row.roomNo, // Maps to CSV column
              name: row.name,     // Maps to CSV column
              rollNo: row.rollNo, // Maps to CSV column
              status: row.status,  // Maps to CSV column
              hostel: hostelId     // Ensure this matches hostel 2
            };
            roomsToAdd.push(room);
          })
          .on('end', async () => {
            try {
              const result = await Room.insertMany(roomsToAdd);
              console.log(`Added ${result.length} new rooms from CSV for hostel ${hostelId}`);
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    }

    // Call the new function with the path to your CSV file
    await importRoomsFromCSV('../csv/hostel2.csv'); // Updated to relative path

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