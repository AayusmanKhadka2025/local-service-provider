const express = require('express');
const passport = require('passport');
const { 
  registerUser, 
  loginUser, 
  sendOTP, 
  verifyOTP, 
  resendOTP,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  googleAuthSuccess,
  googleAuthFailure
} = require('../controllers/authController');

const router = express.Router();

// Register route
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

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false
  }),
  (req, res) => {
    console.log('Callback received, user object:', req.user);
    const isNewUser = req.user?.isNewUser || false;
    // Pass both req and res to the handler
    googleAuthSuccess(req, res, isNewUser);
  }
);

router.get('/google/success', googleAuthSuccess);
router.get('/google/failure', googleAuthFailure);

module.exports = router;