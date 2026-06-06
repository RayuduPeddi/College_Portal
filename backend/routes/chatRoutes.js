const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Auth middleware for all chat routes
router.use(authMiddleware);

// Set up Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get total unread messages count for the current user
router.get('/unread-count', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const count = await Message.countDocuments({
      receiverId: currentUserId,
      read: false
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error fetching total unread count:', error);
    res.status(500).json({ success: false, message: 'Server error fetching unread count' });
  }
});

// 1. Get all users for chat list
router.get('/users', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const users = await User.find({ _id: { $ne: currentUserId } }, 'name email role profilePicture');
    
    // For each user, query the number of unread messages sent to the current user
    const usersWithUnread = await Promise.all(users.map(async (u) => {
      const unreadCount = await Message.countDocuments({
        senderId: u._id,
        receiverId: currentUserId,
        read: false
      });
      return {
        ...u.toObject(),
        unreadCount
      };
    }));

    res.json({ success: true, data: usersWithUnread });
  } catch (error) {
    console.error('Error fetching users for chat:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// 2. Get message history with a specific user
router.get('/messages/:otherUserId', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
});

// 3. File upload via multer
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Return relative file path
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: 'Server error during file upload' });
  }
});

// 4. Mark all messages from a user to the current user as read
router.post('/read/:senderId', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId } = req.params;

    await Message.updateMany(
      { senderId: senderId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

    // Get Socket.io instance and notify the sender that their messages have been read
    const io = req.app.get('socketio');
    if (io) {
      io.to(senderId).emit('messagesRead', { readerId: currentUserId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error marking messages as read' });
  }
});

module.exports = router;
