const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  semesterName: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    required: true
  }]
});

const curriculumSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true
  },
  semesters: [semesterSchema]
});

module.exports = mongoose.model('Curriculum', curriculumSchema);
