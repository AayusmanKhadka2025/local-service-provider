const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendVerificationEmail } = require('../services/emailService');

// Helper function to get full avatar URL
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `http://localhost:5050${avatarPath}`;
};

// Generate JWT Token for users
const generateUserToken = (userId, email, fullName) => {
  return jwt.sign(
    { id: userId, email, fullName, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Password validation function
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
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
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
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
      password: hashedPassword
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, fullName, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      email: email
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify OTP and complete registration
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Create user account
    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email,
      password: otpRecord.password, // Already hashed
      phone: '',
      gender: 'Male',
      country: 'Nepal',
      province: 'Bagmati Province',
      city: 'Kathmandu',
      area: 'Thamel',
      landmark: 'Near Kathmandu Durbar Square',
      avatar: ''
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate token for auto-login
    const token = generateUserToken(user._id, user.email, user.fullName);

    // Remove password from response
    const userWithoutPassword = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      country: user.country,
      province: user.province,
      city: user.city,
      area: user.area,
      landmark: user.landmark,
      avatar: getFullAvatarUrl(user.avatar),
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Email verified and account created successfully!',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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
        message: 'Email is required'
      });
    }

    // Find existing OTP record
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'No pending verification found. Please sign up again.'
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Update OTP
    otpRecord.otp = newOTP;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    // Send new verification email
    const emailSent = await sendVerificationEmail(email, otpRecord.fullName, newOTP);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email.'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateUserToken(user._id, user.email, user.fullName);

    const userWithoutPassword = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      gender: user.gender || 'Male',
      country: user.country || 'Nepal',
      province: user.province || '',
      city: user.city || '',
      area: user.area || '',
      landmark: user.landmark || '',
      avatar: getFullAvatarUrl(user.avatar),
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
  resendOTP
};