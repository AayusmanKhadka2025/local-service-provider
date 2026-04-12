const express = require('express');
const { 
  registerUser, 
  loginUser, 
  sendOTP, 
  verifyOTP, 
  resendOTP 
} = require('../controllers/authController');

const router = express.Router();

// Register route (optional - for direct registration)
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// OTP routes for email verification
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;