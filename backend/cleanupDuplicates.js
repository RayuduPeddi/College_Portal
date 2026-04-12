const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collegeportal')
  .then(async () => {
    console.log('MongoDB connected for cleanup.');

    // Cleanup Duplicates in Attendance
    const attendances = await Attendance.find({});
    const attendanceMap = new Map();
    let attendanceDeleted = 0;

    for (const a of attendances) {
      if (!a.studentId || !a.date) continue;
      // Start of day string for uniqueness
      const d = new Date(a.date);
      d.setHours(0,0,0,0);
      const key = `${a.studentId.toString()}_${a.subject || 'General'}_${d.toISOString()}`;
      if (attendanceMap.has(key)) {
        await Attendance.findByIdAndDelete(a._id);
        attendanceDeleted++;
      } else {
        attendanceMap.set(key, true);
      }
    }
    console.log(`Deleted ${attendanceDeleted} duplicate attendance records.`);

    // Cleanup Duplicates in Marks
    const marks = await Marks.find({});
    const marksMap = new Map();
    let marksDeleted = 0;

    for (const m of marks) {
      if (!m.studentId || !m.subject) continue;
      const key = `${m.studentId.toString()}_${m.subject}`;
      if (marksMap.has(key)) {
        await Marks.findByIdAndDelete(m._id);
        marksDeleted++;
      } else {
        marksMap.set(key, true);
      }
    }
    console.log(`Deleted ${marksDeleted} duplicate marks records.`);

    console.log('Cleanup finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
