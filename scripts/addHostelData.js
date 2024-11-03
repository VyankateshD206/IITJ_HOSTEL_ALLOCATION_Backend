const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Adjust paths based on the script's location
const rootDir = path.resolve(__dirname, '../..');
const apiDir = path.join(rootDir, 'api');

// Update require paths
const Hostel = require(path.join(apiDir, 'models', 'Hostel'));
const Room = require(path.join(apiDir, 'models', 'RoomData'));

// Update the envPath to look in the api folder
const envPath = path.join(apiDir, '.env');
console.log('Loading .env file from:', envPath);
require('dotenv').config({ path: envPath });

console.log('MONGO_URL:', process.env.MONGO_URL);

if (!process.env.MONGO_URL) {
  console.error('MONGO_URL is not defined in the .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
  .then(() => 
    
    console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function addHostelData() {
  try {
    console.log('Starting to add hostel data...');

    // Add 17 hostels
    for (let i = 1; i <= 17; i++) {
      const hostel = await Hostel.create({
        name: `Hostel ${i}`,
        totalRooms: 100, // You can adjust this as needed
        availableRooms: 100, // Initially all rooms are available
        image: `https://example.com/hostel${i}.jpg`
      });
      console.log(`Created Hostel ${i} with ID: ${hostel._id}`);
    }

    console.log('Hostels added successfully');

    // Import room data for each hostel
    const hostels = await Hostel.find();
    
    for (const hostel of hostels) {
      const results = [];
      const csvFilePath = path.join(apiDir, 'csv', `hostel${hostel.name.split(' ')[1]}.csv`);

      console.log(`Processing ${csvFilePath}`);

      if (!fs.existsSync(csvFilePath)) {
        console.error(`CSV file not found: ${csvFilePath}`);
        continue;
      }

      // Read CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv({
            headers: ['roomNo', 'name', 'rollNo', 'status'],
            skipLines: 1
          }))
          .on('data', (data) => {
            // Remap the data to match our schema
            results.push({
              roomNo: data.roomNo,
              name: data.name,
              rollNo: data.rollNo,
              status: data.status
            });
          })
          .on('end', resolve)
          .on('error', (error) => {
            console.error(`Error reading CSV for ${hostel.name}:`, error);
            reject(error);
          });
      });

      console.log(`Read ${results.length} rooms from CSV for ${hostel.name}`);

      // Add rooms to database
      for (const room of results) {
        await Room.create({
          ...room,
          hostel: hostel._id
        });
      }

      // Update available rooms count
      const occupiedRooms = results.filter(room => room.status.toLowerCase() === 'occupied').length;
      hostel.availableRooms = hostel.totalRooms - occupiedRooms;
      await hostel.save();

      console.log(`Room data added for ${hostel.name}. Available rooms: ${hostel.availableRooms}`);
    }

    console.log('All room data added successfully');
  } catch (error) {
    console.error('Error adding hostel data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

addHostelData().then(() => console.log('Script completed'));