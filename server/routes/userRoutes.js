const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  changePassword, 
  uploadAvatar,
  getProfile,
  upload 
} = require('../controllers/userController');

// Profile routes
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/upload-avatar', upload.single('image'), uploadAvatar);
router.get('/profile/:email', getProfile);

module.exports = router;