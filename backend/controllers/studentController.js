const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');

const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId', 'name email');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found' });
    
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user.id })
      .populate('teacherId', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};

const getMyMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user.id })
      .populate('teacherId', 'name');
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching marks' });
  }
};

module.exports = {
  getProfile,
  getMyAttendance,
  getMyMarks
};
