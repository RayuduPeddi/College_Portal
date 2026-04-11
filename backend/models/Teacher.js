const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);
