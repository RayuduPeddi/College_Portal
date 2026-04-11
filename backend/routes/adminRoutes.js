const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin only' });
  }
  next();
};

router.use(authMiddleware);
router.use(adminOnly);

router.get('/students', adminController.getAllStudents);
router.post('/students', adminController.addStudent);
router.delete('/students/:id', adminController.deleteStudent);

router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers', adminController.addTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

router.get('/attendance/:studentId', adminController.getStudentAttendance);
router.get('/marks/:studentId', adminController.getStudentMarks);

router.get('/notices', adminController.getAllNotices);
router.post('/notices', adminController.createNotice);
router.delete('/notices/:id', adminController.deleteNotice);

router.get('/complaints', adminController.getAllComplaints);
router.patch('/complaints/:id/status', adminController.updateComplaintStatus);

module.exports = router;
