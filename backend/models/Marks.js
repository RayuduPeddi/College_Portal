const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 100
  }
});

module.exports = mongoose.model('Marks', marksSchema);
