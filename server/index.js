const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ✅ FIRST: Apply CORS middleware (this must come before routes)
app.use(
  cors({
    origin: "http://localhost:5173", // Your React app URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ SECOND: Handle preflight requests
app.options("*", cors());

// ✅ THIRD: Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FOURTH: Serve static files (for uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ FIFTH: Routes (AFTER CORS middleware)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // This is now properly placed after CORS
app.use("/api/providers", providerRoutes);
app.use('/api/admin', adminRoutes); // Add this line

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "local-services-db",
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");

    // Create uploads directory if it doesn't exist
    const fs = require("fs");
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
      console.log("✅ Uploads directory created");
    }

    // Create initial admin
    const { createInitialAdmin } = require('./controllers/adminController');
    createInitialAdmin();

    const PORT = process.env.PORT || 5050; // Make sure this matches your .env
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

app.use("/api/bookings", bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});
