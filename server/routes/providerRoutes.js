const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  registerProvider,
  providerLogin,
  getAllProviders // Add this import
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
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
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

// Public routes
router.post('/register', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 }
]), registerProvider);

router.post('/login', providerLogin);
router.get('/all', getAllProviders); // Add this route

module.exports = router;