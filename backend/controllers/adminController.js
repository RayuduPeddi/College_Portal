const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const Material = require('../models/Material');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    const { name, email, rollNo, department } = req.body;

    if (!name || !email || !rollNo || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Roll No, Department)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const existingRoll = await Student.findOne({ rollNo });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: 'Roll Number already exists in the system' });
    }

    // Generate a temporary random password server-side — admin cannot choose the password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

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

    // Note: we do not return the temporary password in API response for security.
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
    const { name, email, subject, department } = req.body;

    if (!name || !email || !subject || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Subject, Department)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Generate a temporary random password server-side — admin cannot choose the password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

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

// Study materials handlers
const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!title || !subject) {
      return res.status(400).json({ success: false, message: 'Title and Subject are required' });
    }
    const newMaterial = new Material({
      title,
      description,
      subject,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedBy: req.user.id
    });
    await newMaterial.save();
    res.json({ success: true, data: newMaterial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error uploading study material' });
  }
};

const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().populate('uploadedBy', 'name email role').sort({ date: -1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching materials' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting material' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { name, email, rollNo, department } = req.body;
    
    if (!name || !email || !rollNo || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Roll No, Department)' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if email is in use by another user
    const existingEmail = await User.findOne({ email, _id: { $ne: student.userId } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another account' });
    }

    // Check if roll number is in use by another student
    const existingRoll = await Student.findOne({ rollNo, _id: { $ne: req.params.id } });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: 'Roll Number already exists' });
    }

    // Prepare User model updates (name & email) - do NOT allow admin to change password here
    const userUpdates = { name, email };
    await User.findByIdAndUpdate(student.userId, userUpdates);

    // Update Student model
    student.rollNo = rollNo;
    student.department = department;
    await student.save();

    const updatedStudent = await Student.findById(req.params.id).populate('userId', 'name email').exec();
    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Error updating student' });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { name, email, subject, department } = req.body;

    if (!name || !email || !subject || !department) {
      return res.status(400).json({ success: false, message: 'All fields are required (Name, Email, Subject, Department)' });
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Check if email is in use by another user
    const existingEmail = await User.findOne({ email, _id: { $ne: teacher.userId } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another account' });
    }

    // Prepare User model updates (name & email) - do NOT allow admin to change password here
    const userUpdates = { name, email };
    await User.findByIdAndUpdate(teacher.userId, userUpdates);

    // Update Teacher model
    teacher.subject = subject;
    teacher.department = department;
    await teacher.save();

    const updatedTeacher = await Teacher.findById(req.params.id).populate('userId', 'name email').exec();
    res.json({ success: true, data: updatedTeacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ success: false, message: 'Error updating teacher' });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  getAllTeachers,
  addTeacher,
  deleteTeacher,
  updateTeacher,
  getStudentAttendance, getStudentMarks,
  getAllNotices, createNotice, deleteNotice,
  getAllComplaints, updateComplaintStatus,
  uploadMaterial, getAllMaterials, deleteMaterial
};

