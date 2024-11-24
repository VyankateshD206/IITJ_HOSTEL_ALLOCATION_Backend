const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Room = require('../models/RoomData'); // Adjust the path as necessary
const Hostel = require('../models/Hostel'); // Adjust the path as necessary
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const updateHostel4FromCSV = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URL);

    // Find the hostel with the name "Hostel 4"
    const hostel = await Hostel.findOne({ name: 'Hostel 4' });
    if (!hostel) {
      console.log('Hostel 4 not found');
      return;
    }

    // Read the CSV file
    const roomsData = [];
    fs.createReadStream('../csv/hostel4.csv') // Adjust the path as necessary
      .pipe(csv())
      .on('data', (row) => {
        console.log('Row data:', row); // Log the row data
        roomsData.push(row);
      })
      .on('end', async () => {
        console.log('CSV file successfully processed');
        console.log(roomsData); // Log the data read from the CSV

        // Update each room in the database
        for (const room of roomsData) {
          // Access the fields using the exact header names
          const { 'roomNo': roomNo, name, 'rollNo': rollNo, status, checkInDate, checkOutDate } = room;

          // Log the room number to check if it's being read correctly
          console.log(`Updating room: ${roomNo}, Hostel ID: ${hostel._id}`); // Log the update attempt

          // Convert dates from DD-MM-YYYY to YYYY-MM-DD
          const formatDate = (dateStr) => {
            if (!dateStr) return null; // Return null if the date string is empty
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null; // Return null if the format is incorrect
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Convert to YYYY-MM-DD
          };

          const formattedCheckInDate = formatDate(checkInDate);
          const formattedCheckOutDate = formatDate(checkOutDate);

          const result = await Room.updateOne(
            { roomNo: roomNo, hostel: hostel._id },
            {
              $set: {
                name: name || '',
                rollNo: rollNo || '',
                status: status || 'available', // Ensure status is set
                checkInDate: formattedCheckInDate,
                checkOutDate: formattedCheckOutDate,
              },
            },
            { upsert: true }
          );

          console.log(`Update result for room ${roomNo}:`, result); // Log the result of the update
        }

        console.log('Rooms updated successfully.');
        mongoose.connection.close();
      });
  } catch (error) {
    console.error('Error updating rooms from CSV:', error);
  }
};

// Run the update function
updateHostel4FromCSV();