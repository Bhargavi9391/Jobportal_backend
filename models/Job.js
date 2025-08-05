const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  position: String,
  company: String,
  location: String,
  workType: String,
  skills: [String],
  education: String,
  expectedYear: {
    type: String,
    required: false  
  },
  description: String,
  vacancies: String,
  salary: String,
  postedTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', jobSchema);
