require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

const app = express();

// ✅ Corrected CORS Setup
app.use(cors({
  origin: "https://frontend-jobportal-wt9b.onrender.com",  // ✅ your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false  // ❌ Set to false unless you use cookies/auth
}));

// ✅ Middleware
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// ✅ Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Please provide both email and password.' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ message: 'Invalid credentials.' });

    res.json({ message: 'Login successful!', user });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
});

// ✅ Reset Password
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed.', error: err.message });
  }
});

// ✅ Post Job
app.post('/jobs', async (req, res) => {
  try {
    console.log("📥 Received job data:", req.body);
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ message: "Job posted successfully!" });
  } catch (err) {
    console.error("❌ Error posting job:", err.message);
    res.status(500).json({ message: "Error posting job.", error: err.message });
  }
});

// ✅ Get All Jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs.", error: err.message });
  }
});

// ✅ Delete Job by ID
app.delete('/jobs/:id', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting job.", error: err.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
