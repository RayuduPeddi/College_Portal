const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Student', studentSchema);
