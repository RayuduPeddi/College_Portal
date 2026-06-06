const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer Storage for study materials upload
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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for PDFs/academic resources
});

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
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);

router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers', adminController.addTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

router.get('/attendance/:studentId', adminController.getStudentAttendance);
router.get('/marks/:studentId', adminController.getStudentMarks);

router.get('/notices', adminController.getAllNotices);
router.post('/notices', adminController.createNotice);
router.delete('/notices/:id', adminController.deleteNotice);

router.get('/complaints', adminController.getAllComplaints);
router.patch('/complaints/:id/status', adminController.updateComplaintStatus);

// Study Materials routes
router.post('/materials', upload.single('file'), adminController.uploadMaterial);
router.get('/materials', adminController.getAllMaterials);
router.delete('/materials/:id', adminController.deleteMaterial);

module.exports = router;

