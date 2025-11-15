require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

const app = express();

// =================== CORS Setup ===================
const corsOptions = {
  origin: [
    "https://frontend-jobportal-wt9b.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // allow cookies if needed
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// =================== Middleware ===================
app.use(express.json());

// =================== MongoDB Connection ===================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// =================== Routes ===================

// Register User
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields are required." });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, isAdmin: false });
    await newUser.save();

    res.status(201).json({ message: "Registration successful!", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

// Login User
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials." });

    res.json({ message: "Login successful!", user });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: "Email and new password required." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed.", error: err.message });
  }
});

// Post Job
app.post('/jobs', async (req, res) => {
  try {
    const { position, company, location, workType, expectedYear, description, vacancies, salary, postedTime, skills, education } = req.body;
    const job = new Job({ position, company, location, workType, expectedYear, description, vacancies, salary, postedTime: postedTime || new Date(), skills, education });
    await job.save();
    res.status(201).json({ message: "Job posted successfully!", job });
  } catch (err) {
    res.status(500).json({ message: "Error posting job.", error: err.message });
  }
});

// Get Jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs.", error: err.message });
  }
});

// Delete Job
app.delete('/jobs/:id', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting job.", error: err.message });
  }
});

// =================== Start Server ===================
const PORT = parseInt(process.env.PORT) || 10000;
console.log("🚀 Starting server on port:", PORT);
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
