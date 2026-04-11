const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
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
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
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

module.exports = {
  getAllStudents,
  addStudent,
  deleteStudent,
  getAllTeachers,
  addTeacher,
  deleteTeacher,
  getStudentAttendance, getStudentMarks
};
