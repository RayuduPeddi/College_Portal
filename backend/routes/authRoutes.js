const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer Storage for profile picture upload
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
});

router.post('/login', authController.loginUser);
router.post('/profile-picture', authMiddleware, upload.single('profilePicture'), authController.updateProfilePicture);
router.put('/profile', authMiddleware, authController.updateSelf);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/forgot-password-admin', authController.forgotPasswordAdmin);

module.exports = router;


