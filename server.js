require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

const app = express();

// ================= CORS Setup =================
const allowedOrigins = [
  "https://frontend-jobportal-wt9b.onrender.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests for all routes
app.options('*', cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ================= Middleware =================
app.use(express.json()); // parse JSON requests

// ================= MongoDB Connection =================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ================= Auth middleware =================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided." });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Invalid Authorization format. Use: Bearer <token>" });

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token." });
    req.user = decoded;
    next();
  });
}

// ================= Routes ==================

// --- Get current user info ---
app.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found.' });
      return res.json({ authenticated: true, role: req.user.role || (user.isAdmin ? 'admin' : 'user'), user });
    }
    return res.json({ authenticated: true, role: req.user.role || 'admin' });
  } catch (err) {
    res.status(500).json({ message: 'Token verify failed.', error: err.message });
  }
});

// --- Register ---
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, isAdmin: false });
    await newUser.save();

    const safeUser = { _id: newUser._id, name: newUser.name, email: newUser.email, isAdmin: newUser.isAdmin };
    res.status(201).json({ message: "Registration successful!", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

// --- Login ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Please provide both email and password.' });

  try {
    // Admin login
    if (email === "admin@gmail.com" && password === "Admin@123") {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ message: "Login successful!", token, role: "admin" });
    }

    // User login
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
    const safeUser = { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin };

    return res.json({ message: "Login successful!", token, role: "user", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
});

// --- Reset Password ---
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed.', error: err.message });
  }
});

// --- Change Password ---
app.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Not allowed." });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error updating password", error: err.message });
  }
});

// --- Post Job (admin only) ---
app.post('/jobs', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: "Only admin can post jobs." });

    const job = new Job({
      ...req.body,
      postedTime: req.body.postedTime || new Date(),
      postedBy: req.user.id || 'admin'
    });
    await job.save();
    res.status(201).json({ message: "Job posted successfully!", job });
  } catch (err) {
    res.status(500).json({ message: "Error posting job.", error: err.message });
  }
});

// --- Get Jobs ---
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs.", error: err.message });
  }
});

// --- Delete Job (admin only) ---
app.delete('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: "Only admin can delete jobs." });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting job.", error: err.message });
  }
});

// ================= Start Server =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

