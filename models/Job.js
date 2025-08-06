const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  position: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  workType: String,
  expectedYear: Number,
  description: String,
  vacancies: Number,
  salary: String,
  postedTime: { type: Date, default: Date.now },
  skills: [String],
  education: String
});

module.exports = mongoose.model("Job", jobSchema);
