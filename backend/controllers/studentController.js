const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');

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

const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notices' });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { subject, description } = req.body;
    const newComplaint = new Complaint({
      subject,
      description,
      studentId: req.user.id
    });
    const savedComplaint = await newComplaint.save();
    res.json({ success: true, data: savedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating complaint' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching complaints' });
  }
};

module.exports = {
  getProfile,
  getMyAttendance,
  getMyMarks,
  getAllNotices,
  createComplaint,
  getMyComplaints
};
