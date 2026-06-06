const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const Material = require('./models/Material');

// Connect to MongoDB
require('dotenv').config();

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collegeportal';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany({}); 
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Attendance.deleteMany({});
    await Marks.deleteMany({});
    await Material.deleteMany({});
    console.log('Database cleared');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedTeacherPassword = await bcrypt.hash('teacher123', 10);
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    // 1. Create Admin
    const admin = new User({
      name: 'PEDDI RAYUDU',
      email: 'admin@gmail.com',
      password: hashedAdminPassword,
      role: 'admin'
    });
    await admin.save();

    // 2. Create Teachers
    const teacher1 = new User({ name: 'Dr.Santhosh Kumar', email: 'teacher1@gmail.com', password: hashedTeacherPassword, role: 'teacher' });
    const savedTeacher1 = await teacher1.save();
    await new Teacher({ userId: savedTeacher1._id, subject: 'Artificial Intelligence', department: 'CSE' }).save();

    const teacher2 = new User({ name: 'Dr.Tirupathi Reddy', email: 'teacher2@gmail.com', password: hashedTeacherPassword, role: 'teacher' });
    const savedTeacher2 = await teacher2.save();
    await new Teacher({ userId: savedTeacher2._id, subject: 'Data Structures & Algorithms', department: 'CSE' }).save();

    // 3. Create Students
      const studentUser1 = new User({ name: `Aravind`, email: `student1@gmail.com`, password: hashedStudentPassword, role: 'student' });
      const savedStudent1 = await studentUser1.save();
      await new Student({ userId: savedStudent1._id, rollNo: `23VD1A6613`, department: 'CSE(AI&ML)' }).save();

      const studentUser2 = new User({ name: `Chandu`, email: `student2@college.com`, password: hashedStudentPassword, role: 'student' });
      const savedStudent2 = await studentUser2.save();
      await new Student({ userId: savedStudent2._id, rollNo: `23VD1A0512`, department: 'CSE' }).save();

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error in seeding:', error);
    process.exit(1);
  }
};

seedDB();
