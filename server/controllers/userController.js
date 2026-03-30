const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to get full avatar URL
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `http://localhost:5050${avatarPath}`;
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { 
      fullName, 
      phone, 
      gender, 
      province, 
      city, 
      area, 
      landmark,
      avatar 
    } = req.body;
    
    const email = req.body.email;

    console.log('Updating profile for email:', email);
    console.log('Received data:', req.body);

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields - only update if values are provided
    if (fullName !== undefined && fullName !== '') user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (province !== undefined) user.province = province;
    if (city !== undefined) user.city = city;
    if (area !== undefined) user.area = area;
    if (landmark !== undefined) user.landmark = landmark;
    
    // Handle avatar update
    if (avatar && avatar !== user.avatar) {
      // Extract just the path part if it's a full URL
      if (avatar.startsWith('http://localhost:5050')) {
        user.avatar = avatar.replace('http://localhost:5050', '');
      } else {
        user.avatar = avatar;
      }
    }

    console.log('Saving updated user...');
    await user.save();
    
    // Fetch the updated user to verify
    const updatedUser = await User.findOne({ email });

    // Remove password from response and add full avatar URL
    const userWithoutPassword = {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      gender: updatedUser.gender || 'Male',
      country: updatedUser.country || 'Nepal',
      province: updatedUser.province || '',
      city: updatedUser.city || '',
      area: updatedUser.area || '',
      landmark: updatedUser.landmark || '',
      avatar: getFullAvatarUrl(updatedUser.avatar),
      createdAt: updatedUser.createdAt
    };

    console.log('Profile updated successfully for:', email);
    console.log('Updated user data:', userWithoutPassword);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    console.log('Changing password for email:', email);

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      console.log('Invalid current password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for:', email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: error.message
    });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { email } = req.body;
    const avatarPath = `/uploads/${req.file.filename}`;

    console.log('Uploading avatar for email:', email);
    console.log('Avatar path:', avatarPath);

    // Update user's avatar in database
    const user = await User.findOne({ email });
    if (user) {
      user.avatar = avatarPath;
      await user.save();
      console.log('Avatar updated in database for:', email);
      
      // Return full URL for the frontend
      const fullAvatarUrl = `http://localhost:5050${avatarPath}`;
      
      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: fullAvatarUrl
      });
    } else {
      console.log('User not found for avatar upload:', email);
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload',
      error: error.message
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  uploadAvatar,
  getProfile,
  upload
};