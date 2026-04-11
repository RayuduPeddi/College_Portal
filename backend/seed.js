const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');

// Connect to MongoDB
const seedDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/collegeportal');
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Attendance.deleteMany({});
    await Marks.deleteMany({});
    console.log('Database cleared');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedTeacherPassword = await bcrypt.hash('teacher123', 10);
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    // 1. Create Admin
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: hashedAdminPassword,
      role: 'admin'
    });
    await admin.save();

    // 2. Create Teachers
    const teacher1 = new User({ name: 'teacher1', email: 'teacher1@gmail.com', password: hashedTeacherPassword, role: 'teacher' });
    const savedTeacher1 = await teacher1.save();
    await new Teacher({ userId: savedTeacher1._id, subject: 'Mathematics', department: 'Science' }).save();

    const teacher2 = new User({ name: 'teacher2', email: 'teacher2@gmail.com', password: hashedTeacherPassword, role: 'teacher' });
    const savedTeacher2 = await teacher2.save();
    await new Teacher({ userId: savedTeacher2._id, subject: 'Physics', department: 'Science' }).save();

    // 3. Create Students
    for(let i = 1; i <= 3; i++) {
      const studentUser = new User({ name: `Student ${i}`, email: `student${i}@college.com`, password: hashedStudentPassword, role: 'student' });
      const savedStudent = await studentUser.save();
      await new Student({ userId: savedStudent._id, rollNo: `23VD1A05${i}`, department: 'Computer Science And Engineering' }).save();
    }

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error in seeding:', error);
    process.exit(1);
  }
};

seedDB();
