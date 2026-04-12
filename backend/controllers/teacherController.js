const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Notice = require('../models/Notice');

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
    const { records } = req.body;
    if (records && Array.isArray(records)) {
      for (const record of records) {
        const startOfDay = new Date(record.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(record.date);
        endOfDay.setHours(23, 59, 59, 999);
        const existing = await Attendance.findOne({
          studentId: record.studentUserId,
          subject: record.subject || 'General',
          date: { $gte: startOfDay, $lte: endOfDay }
        });
        if (existing) {
          return res.status(400).json({ success: false, message: `Attendance already marked for student ID: ${record.studentUserId} on this date` });
        }
      }

      const attendancePromises = records.map(record => {
        return new Attendance({
          studentId: record.studentUserId,
          teacherId: req.user.id,
          date: record.date,
          status: record.status,
          subject: record.subject || 'General'
        }).save();
      });
      await Promise.all(attendancePromises);
      return res.json({ success: true, message: 'Bulk attendance saved successfully' });
    }

    const { studentUserId, date, status, subject } = req.body;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const existing = await Attendance.findOne({
      studentId: studentUserId,
      subject: subject || 'General',
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this subject and date' });
    }

    const newAttendance = new Attendance({
      studentId: studentUserId,
      teacherId: req.user.id,
      date,
      status,
      subject: subject || 'General'
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
    const { records } = req.body;
    if (records && Array.isArray(records)) {
      for (const record of records) {
        const existing = await Marks.findOne({
          studentId: record.studentUserId,
          subject: record.subject
        });
        if (existing) {
          return res.status(400).json({ success: false, message: `Marks already exist for student ID: ${record.studentUserId} in ${record.subject}` });
        }
      }

      const marksPromises = records.map(record => {
        return new Marks({
          studentId: record.studentUserId,
          teacherId: req.user.id,
          subject: record.subject,
          marks: record.marks,
          totalMarks: record.totalMarks || 100
        }).save();
      });
      await Promise.all(marksPromises);
      return res.json({ success: true, message: 'Bulk marks saved successfully' });
    }

    const { studentUserId, subject, marks, totalMarks } = req.body;
    const existing = await Marks.findOne({
      studentId: studentUserId,
      subject: subject
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Marks already exist for this subject` });
    }

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

const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notices' });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found or unauthorized' });
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating attendance' });
  }
};

const updateMarks = async (req, res) => {
  try {
    const { marks } = req.body;
    const marksRecord = await Marks.findByIdAndUpdate(
      req.params.id,
      { marks },
      { new: true }
    );
    if (!marksRecord) return res.status(404).json({ success: false, message: 'Marks record not found or unauthorized' });
    res.json({ success: true, data: marksRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating marks' });
  }
};

module.exports = {
  getAllStudents,
  markAttendance,
  getMyMarkedAttendance,
  updateAttendance,
  addMarks,
  getMyAssignedMarks,
  updateMarks,
  getProfile,
  getAllNotices
};
