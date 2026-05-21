const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protectProvider } = require('../middleware/providerAuth');
const {
  registerProvider,
  providerLogin,
  getAllProviders,
  sendProviderOTP,
  verifyProviderOTP,
  resendProviderOTP,
  getProviderProfile,
  updateProviderProfile,
  uploadProviderAvatar,
  changeProviderPassword
} = require('../controllers/providerController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/providers/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and ZIP files are allowed'));
    }
  }
});

// OTP Routes (for email verification)
router.post('/send-otp', sendProviderOTP);
router.post('/verify-otp', verifyProviderOTP);
router.post('/resend-otp', resendProviderOTP);

// Original registration route (kept for compatibility)
router.post('/register', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 }
]), registerProvider);

router.post('/login', providerLogin);
router.get('/all', getAllProviders);

// Protected routes (require authentication)
router.get('/profile/:email', protectProvider, getProviderProfile);
router.put('/profile', protectProvider, updateProviderProfile);
router.post('/upload-avatar', protectProvider, upload.single('profileImage'), uploadProviderAvatar);
router.put('/change-password', protectProvider, changeProviderPassword);

module.exports = router;