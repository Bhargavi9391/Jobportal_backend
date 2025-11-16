// models/Job.js
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
  education: String,
  expiresAt: { type: Date, default: null },   // <-- expiry date/time (optional)
  postedBy: { type: String, default: 'admin' } // user id or 'admin'
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
