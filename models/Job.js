const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  position: String,
  company: String,
  location: String,
  workType: String,
  expectedYear: String,
  description: String,
  vacancies: Number,
  salary: String,
  postedTime: { type: Date, default: Date.now },
  skills: [String],
  education: String
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
