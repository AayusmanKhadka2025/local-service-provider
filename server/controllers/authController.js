const User = require("../models/User");
const OTP = require("../models/OTP");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// Helper function to get full avatar URL
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return "";
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5050${avatarPath}`;
};

// Generate JWT Token for users
// Generate JWT Token for users
const generateUserToken = (userId, email, fullName) => {
  // Make sure userId is a string and exists
  if (!userId) {
    console.error("Cannot generate token: userId is missing");
    return null;
  }

  const userIdStr = userId.toString();
  console.log("Generating token for userId:", userIdStr);

  return jwt.sign(
    {
      id: userIdStr, // This is what the middleware looks for
      userId: userIdStr, // Backup field
      email,
      fullName,
      role: "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Google Auth Success Handler
// Google Auth Success Handler
// Google Auth Success Handler
const googleAuthSuccess = async (req, res, isNewUser = false) => {
  try {
    // Check if user data exists in the request
    const user = req.user;

    if (!user) {
      console.error("No user data in request");
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=Authentication failed`,
      );
    }

    console.log("Google auth success for user:", {
      id: user._id,
      email: user.email,
      isNewUser,
      userIdType: typeof user._id,
    });

    // Make sure we have a valid user ID
    if (!user._id) {
      console.error("User ID is missing");
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=User ID missing`,
      );
    }

    // Generate token with the correct user ID
    const token = generateUserToken(user._id, user.email, user.fullName);

    console.log("Generated token for user:", user._id);

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
      isNewUser: isNewUser,
      isGoogleAccount: user.isGoogleAccount || true,
    };

    // Encode user data for URL
    const encodedUser = encodeURIComponent(JSON.stringify(userWithoutPassword));

    // Redirect to frontend with token and user data
    const redirectUrl = `${process.env.FRONTEND_URL}/google-auth-callback?token=${token}&user=${encodedUser}`;
    console.log("Redirecting to frontend with token");
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google auth success error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=Google authentication failed`,
    );
  }
};

// Google Auth Failure Handler
const googleAuthFailure = (req, res) => {
  res.redirect(
    `${process.env.FRONTEND_URL}/login?error=Google authentication failed`,
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

    // Create user account with the already hashed password
    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email.toLowerCase(),
      password: otpRecord.password,
      phone: "",
      gender: "Male",
      country: "Nepal",
      province: "Bagmati Province",
      city: "Kathmandu",
      area: "Thamel",
      landmark: "Near Kathmandu Durbar Square",
      avatar: "",
      isGoogleAccount: false,
    });

    console.log("User created successfully:", user._id);

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

// ========== PASSWORD RESET FUNCTIONS ==========

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
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Check if user is a Google account
    if (user.isGoogleAccount) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please login with Google.",
      });
    }

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to database
    await PasswordReset.create({
      email: email.toLowerCase(),
      token: hashedToken,
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      email,
      user.fullName,
      resetUrl,
    );

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

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete all reset tokens for this user
    await PasswordReset.deleteMany({ email: resetRecord.email });

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully! Please login with your new password.",
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

// Keep original register function for reference
const registerUser = async (req, res) => {
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // First check if email exists as a PROVIDER
    const Provider = require("../models/Provider");
    const existingProvider = await Provider.findOne({
      email: email.toLowerCase(),
    });

    if (existingProvider) {
      return res.status(401).json({
        success: false,
        message:
          "This email is registered as a Service Provider. Please login from the Provider Login page.",
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

    // Check if user is a Google account
    if (user.isGoogleAccount) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google Sign-In. Please login with Google.",
      });
    }

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
  googleAuthSuccess,
  googleAuthFailure,
};
