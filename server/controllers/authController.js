const User = require("../models/User");
const OTP = require("../models/OTP");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail, // Add this import
} = require("../services/emailService");

// Helper function to get full avatar URL
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return "";
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5050${avatarPath}`;
};

// Generate JWT Token for users
const generateUserToken = (userId, email, fullName) => {
  return jwt.sign(
    { id: userId, email, fullName, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Password validation function
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Send OTP for email verification
const sendOTP = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Hash password before storing temporarily
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store OTP and user data temporarily
    await OTP.create({
      email,
      otp,
      fullName,
      password: hashedPassword,
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, fullName, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      email: email,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify OTP and complete registration (without auto-login)
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("Verifying OTP for:", email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      console.log("Invalid or expired OTP for:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    console.log("OTP found, creating user account for:", email);
    console.log(
      "Password hash from OTP record (length):",
      otpRecord.password.length,
    );
    console.log("Is it a bcrypt hash?", otpRecord.password.startsWith("$2b$"));

    // Create user account with the already hashed password
    // Use create() directly - the pre-save hook will detect it's already hashed
    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email.toLowerCase(),
      password: otpRecord.password, // This is already hashed from OTP record
      phone: "",
      gender: "Male",
      country: "Nepal",
      province: "Bagmati Province",
      city: "Kathmandu",
      area: "Thamel",
      landmark: "Near Kathmandu Durbar Square",
      avatar: "",
    });

    console.log("User created successfully:", user._id);
    console.log("Stored password hash length:", user.password.length);
    console.log(
      "Is stored hash a bcrypt hash?",
      user.password.startsWith("$2b$"),
    );

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Return success WITHOUT token (user must login manually)
    res.status(201).json({
      success: true,
      message:
        "Email verified and account created successfully! Please login to continue.",
      email: user.email,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find existing OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "No pending verification found. Please sign up again.",
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();

    // Update OTP
    otpRecord.otp = newOTP;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    // Send new verification email
    const emailSent = await sendVerificationEmail(
      email,
      otpRecord.fullName,
      newOTP,
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== PASSWORD RESET FUNCTIONS (NEW) ==========

// Send password reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal that user doesn't exist
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token to database
    await PasswordReset.create({
      email: email.toLowerCase(),
      token: hashedToken,
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, user.fullName, resetUrl);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find token in database
    const resetRecord = await PasswordReset.findOne({ token: hashedToken });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Get user email
    const user = await User.findOne({ email: resetRecord.email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      email: user.email,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find token in database
    const resetRecord = await PasswordReset.findOne({ token: hashedToken });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Find user
    const user = await User.findOne({ email: resetRecord.email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password (let the pre-save hook hash it)
    user.password = newPassword;
    await user.save();

    // Delete all reset tokens for this user
    await PasswordReset.deleteMany({ email: resetRecord.email });

    res.status(200).json({
      success: true,
      message: "Password reset successfully! Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Keep original register function for reference (optional)
const registerUser = async (req, res) => {
  // This can be kept for admin creation or removed
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    // ... existing code
  } catch (error) {
    // ... existing code
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password provided:", password ? "Yes" : "No");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("User found:", user.email);
    console.log(
      "Stored password hash length:",
      user.password ? user.password.length : "No password",
    );

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateUserToken(user._id, user.email, user.fullName);
    console.log("Login successful for:", email);
    console.log("===================");

    const userWithoutPassword = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      gender: user.gender || "Male",
      country: user.country || "Nepal",
      province: user.province || "",
      city: user.city || "",
      area: user.area || "",
      landmark: user.landmark || "",
      avatar: getFullAvatarUrl(user.avatar),
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};