const express = require('express');
const { 
  registerUser, 
  loginUser, 
  sendOTP, 
  verifyOTP, 
  resendOTP,
  forgotPassword,
  verifyResetToken,
  resetPassword
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

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;