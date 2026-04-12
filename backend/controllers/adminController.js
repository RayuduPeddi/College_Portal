const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const bcrypt = require('bcryptjs');

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'name email').exec();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
};

const addStudent = async (req, res) => {
  try {
    const { name, email, password, rollNo, department } = req.body;
    
    if (!name || !email || !password || !rollNo || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Password, Roll No, Department)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const existingRoll = await Student.findOne({ rollNo });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: 'Roll Number already exists in the system' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'student'
    });
    const savedUser = await newUser.save();

    const newStudent = new Student({
      userId: savedUser._id,
      rollNo,
      department
    });
    const savedStudent = await newStudent.save();

    res.json({ success: true, data: savedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding student' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(student.userId);
    await Attendance.deleteMany({ studentId: student.userId });
    await Marks.deleteMany({ studentId: student.userId });
    
    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('userId', 'name email').exec();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teachers' });
  }
};

const addTeacher = async (req, res) => {
  try {
    const { name, email, password, subject, department } = req.body;
    
    if (!name || !email || !password || !subject || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Password, Subject, Department)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teacher'
    });
    const savedUser = await newUser.save();

    const newTeacher = new Teacher({
      userId: savedUser._id,
      subject,
      department
    });
    const savedTeacher = await newTeacher.save();

    res.json({ success: true, data: savedTeacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding teacher' });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting teacher' });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId }).populate('teacherId', 'name').sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};

const getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.params.studentId }).populate('teacherId', 'name');
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

const createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNotice = new Notice({
      title,
      content,
      postedBy: req.user.id
    });
    const savedNotice = await newNotice.save();
    res.json({ success: true, data: savedNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating notice' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting notice' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('studentId', 'name email').sort({ date: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching complaints' });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating complaint' });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  deleteStudent,
  getAllTeachers,
  addTeacher,
  deleteTeacher,
  getStudentAttendance, getStudentMarks,
  getAllNotices, createNotice, deleteNotice,
  getAllComplaints, updateComplaintStatus
};
