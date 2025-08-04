require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require("./models/User");  // ✅ Already imported here
const Job = require('./models/Job');

const app = express();

// ✅ CORS Setup
const corsOptions = {
  origin: [
    "https://frontend-jobportal-wt9b.onrender.com",  // ✅ Your frontend URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};
app.use(cors(corsOptions));

// ✅ Middlewares
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Failed to connect to MongoDB:', err));

// ✅ Register Route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Registration failed", error });
  }
});

// ✅ Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    res.json({ message: 'Login successful!', user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in user.' });
  }
});

// ✅ Post Job Route
app.post('/jobs', async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ message: 'Job posted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error posting job', error: error.message });
  }
});

// ✅ Get All Jobs Route
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
