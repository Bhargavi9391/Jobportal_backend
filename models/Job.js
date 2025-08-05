// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  position: String,
  company: String,
  location: String,
  workType: String,
  skills: [String], 
  expectedYear: String,
  description: String,
  vacancies: String,
  salary: String,
  postedTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', jobSchema);
