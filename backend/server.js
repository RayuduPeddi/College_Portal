const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const Message = require('./models/Message');
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Share Socket.io instance with express app so controllers/routes can access it
app.set('socketio', io);

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); 
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware for file uploads and other router exceptions
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Please upload a smaller file (Limits: 5MB for profile photos, 10MB for chat files, 50MB for study materials).'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  
  console.error('Unhandled Route Error:', err);
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their room (based on userId)
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their socket room`);
    }
  });

  // Handle incoming chat messages
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, text, fileUrl, fileName } = data;

      // Save message in DB
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        fileUrl,
        fileName
      });
      await newMessage.save();

      // Emit message to sender and receiver
      io.to(receiverId).emit('receiveMessage', newMessage);
      io.to(senderId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error handling sendMessage socket event:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database Connection (MongoDB Atlas)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('Database connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

