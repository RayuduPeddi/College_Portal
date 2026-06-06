const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
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
router.patch('/attendance/:id', teacherController.updateAttendance);
router.post('/marks', teacherController.addMarks);
router.get('/marks', teacherController.getMyAssignedMarks);
router.patch('/marks/:id', teacherController.updateMarks);
router.get('/profile', teacherController.getProfile);
router.get('/notices', teacherController.getAllNotices);

// Study Materials routes
router.post('/materials', upload.single('file'), teacherController.uploadMaterial);
router.get('/materials', teacherController.getMyMaterials);
router.delete('/materials/:id', teacherController.deleteMaterial);

module.exports = router;

