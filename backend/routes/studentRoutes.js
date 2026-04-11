const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied: Student only' });
  }
  next();
};

router.use(authMiddleware);
router.use(studentOnly);

router.get('/profile', studentController.getProfile);
router.get('/attendance', studentController.getMyAttendance);
router.get('/marks', studentController.getMyMarks);

module.exports = router;
