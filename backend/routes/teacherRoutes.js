const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');

const teacherOnly = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied: Teacher only' });
  }
  next();
};

router.use(authMiddleware);
router.use(teacherOnly);

router.get('/students', teacherController.getAllStudents);
router.post('/attendance', teacherController.markAttendance);
router.get('/attendance', teacherController.getMyMarkedAttendance);
router.post('/marks', teacherController.addMarks);
router.get('/marks', teacherController.getMyAssignedMarks);
router.get('/profile', teacherController.getProfile);
router.get('/notices', teacherController.getAllNotices);

module.exports = router;
