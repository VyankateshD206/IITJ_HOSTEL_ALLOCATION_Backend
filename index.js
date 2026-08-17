const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Room = require('./models/RoomData.js');
const Hostel = require('./models/Hostel');
const cookieParser = require('cookie-parser');

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET || 'fasefraw4r5r3wq45wdfgw34twdfg';

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

mongoose.connect(process.env.MONGO_URL, {
}).then(() => {
  console.log('db connected successfully');
}).catch((e) => {
  console.error(e);
});

app.get('/', (req, res) => {
  res.send('Hostel Room Allocation');
});

app.get('/test', (req, res) => {
  res.json('test ok');
});

function isAuthenticated(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) {
        console.error('JWT Verification Error:', err);
        return res.status(403).json({ message: 'Forbidden: You need to log in first.' });
      }
      req.user = userData;
      next();
    });
  } else {
    console.log('No token found');
    res.status(403).json({ message: 'Forbidden: You need to log in first.' });
  }
}

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });

  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000
        }).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      try {
        const fetcheduser = await User.findById(userData.id);
        if (!fetcheduser) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const { name, email, _id } = fetcheduser;
        res.json({ name, email, _id });
      } catch (error) {
        console.log(error);
        res.json({ error: error.message });
      }
    });
  } else {
    res.json({ error: 'Token NotFound' });
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.get('/hostels', async (req, res) => {
  try {
    const hostels = await Hostel.find();
    if (hostels.length === 0) {
      return res.status(404).json({ error: 'No hostels found' });
    }

    for (let hostel of hostels) {
      const totalRooms = await Room.countDocuments({ hostel: hostel._id });
      const availableRooms = await Room.countDocuments({ hostel: hostel._id, status: 'available' });
      hostel.totalRooms = totalRooms;
      hostel.availableRooms = availableRooms;
    }

    res.json(hostels);
  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({ error: 'An error occurred while fetching hostels' });
  }
});

app.get('/hostels/:hostelId/rooms', async (req, res) => {
  const hostelId = req.params.hostelId;
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const rooms = await Room.find({ hostel: hostelId });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'An error occurred while fetching rooms' });
  }
});

app.get('/rooms/:hostelId/:roomId', async (req, res) => {
  const { hostelId, roomId } = req.params;
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the room' });
  }
});

app.get('/hostels/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    res.json(hostel);
  } catch (error) {
    console.error('Error fetching hostel:', error);
    res.status(500).json({ error: 'An error occurred while fetching the hostel' });
  }
});

app.get('/hostels/:hostelId/room/:roomId', async (req, res) => {
  const { hostelId, roomId } = req.params;
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'An error occurred while fetching the room' });
  }
});

app.post('/hostels/:hostelId/room/:roomId/allocate', isAuthenticated, async (req, res) => {
  const { hostelId, roomId } = req.params;
  const { name, rollNo, checkInDate, checkOutDate } = req.body;

  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status === 'occupied') {
      return res.status(400).json({ error: 'Room is already occupied' });
    }

    room.name = name;
    room.rollNo = rollNo;
    room.status = 'occupied';

    if (hostelId === '6727ad67cfce1a32cd0d9e45') {
      room.checkInDate = checkInDate;
      room.checkOutDate = checkOutDate;
    }

    await room.save();

    hostel.availableRooms = Math.max(0, hostel.availableRooms - 1);
    await hostel.save();

    res.json(room);
  } catch (error) {
    console.error('Error allocating room:', error);
    res.status(500).json({ error: 'An error occurred while allocating the room' });
  }
});

app.post('/hostels/:hostelId/room/:roomId/deallocate', isAuthenticated, async (req, res) => {
  const { hostelId, roomId } = req.params;

  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'occupied') {
      return res.status(400).json({ error: 'Room is not occupied' });
    }

    room.name = '';
    room.rollNo = '';
    room.status = 'available';
    await room.save();

    hostel.availableRooms = Math.min(hostel.totalRooms, hostel.availableRooms + 1);
    await hostel.save();

    res.json(room);
  } catch (error) {
    console.error('Error deallocating room:', error);
    res.status(500).json({ error: 'An error occurred while deallocating the room' });
  }
});

app.get('/rooms/occupied', async (req, res) => {
  try {
    const occupiedRooms = await Room.find({ status: 'occupied' }).populate('hostel', 'name');

    const students = occupiedRooms.map(room => ({
      _id: room._id,
      name: room.name,
      rollNo: room.rollNo,
      roomNo: room.roomNo,
      hostel: room.hostel._id,
      hostelName: room.hostel.name
    }));

    res.json(students);
  } catch (error) {
    console.error('Error fetching occupied rooms:', error);
    res.status(500).json({
      error: 'An error occurred while fetching occupied rooms',
      details: error.message
    });
  }
});

app.get('/students', async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'occupied' });

    if (!rooms || rooms.length === 0) {
      return res.json([]);
    }

    const students = rooms.map(room => ({
      _id: room._id,
      name: room.name || '',
      rollNo: room.rollNo || '',
      roomNo: room.roomNo || '',
      hostelName: 'Unknown Hostel'
    }));

    for (let student of students) {
      try {
        const room = rooms.find(r => r._id.toString() === student._id.toString());
        if (room?.hostel) {
          const hostel = await Hostel.findById(room.hostel);
          if (hostel) {
            student.hostelName = hostel.name;
          }
        }
      } catch (err) {
        console.error(`Error fetching hostel for room ${student._id}:`, err);
      }
    }

    res.json(students);
  } catch (error) {
    console.error('Error in /students:', error);
    res.status(500).json({
      error: 'An error occurred while fetching students',
      details: error.message
    });
  }
});

const port = 4000;
app.listen(process.env.PORT || port, () => {
  console.log(`Server Started at port : ${port}`);
});
