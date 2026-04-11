const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'name email').exec();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { studentUserId, date, status } = req.body;
    
    const newAttendance = new Attendance({
      studentId: studentUserId,
      teacherId: req.user.id,
      date,
      status
    });

    const savedAttendance = await newAttendance.save();
    res.json({ success: true, data: savedAttendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance' });
  }
};

const getMyMarkedAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({ teacherId: req.user.id })
      .populate('studentId', 'name email')
      .sort({ date: -1 })
      .exec();
    res.json({ success: true, data: attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance records' });
  }
};

const addMarks = async (req, res) => {
  try {
    const { studentUserId, subject, marks, totalMarks } = req.body;

    const newMarks = new Marks({
      studentId: studentUserId,
      teacherId: req.user.id,
      subject,
      marks,
      totalMarks: totalMarks || 100
    });

    const savedMarks = await newMarks.save();
    res.json({ success: true, data: savedMarks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding marks' });
  }
};

const getMyAssignedMarks = async (req, res) => {
  try {
    const marksRecords = await Marks.find({ teacherId: req.user.id })
      .populate('studentId', 'name email')
      .exec();
    res.json({ success: true, data: marksRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching marks records' });
  }
};

const getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id }).populate('userId', 'name email');
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teacher profile' });
  }
};

module.exports = {
  getAllStudents,
  markAttendance,
  getMyMarkedAttendance,
  addMarks,
  getMyAssignedMarks,
  getProfile
};
