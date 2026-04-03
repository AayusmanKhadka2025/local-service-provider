const Admin = require('../models/Admin');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking'); // Add this import
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (adminId, username, role) => {
  return jwt.sign(
    { id: adminId, username, role, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact super admin.'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateToken(admin._id, admin.username, admin.role);

    // Remove password from response
    const adminWithoutPassword = {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: adminWithoutPassword
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await Provider.countDocuments();
    const pendingProviders = await Provider.countDocuments({ isVerified: false });
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        pendingProviders
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Providers for Admin (including unverified)
// Get All Providers for Admin (including unverified)
const getAllProviders = async (req, res) => {
  try {
    // Admin sees ALL providers regardless of verification status
    const providers = await Provider.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Helper function to get full image URL
    const getFullImageUrl = (imagePath) => {
      if (!imagePath) return '';
      if (imagePath.startsWith('http')) return imagePath;
      return `http://localhost:5050${imagePath}`;
    };
    
    // Fetch reviews for each provider
    const providersWithReviews = await Promise.all(providers.map(async (provider) => {
      try {
        const reviews = await Booking.find({
          'provider.providerId': provider._id,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        })
        .select('user.name rating review createdAt')
        .sort({ createdAt: -1 })
        .limit(5);
        
        return {
          ...provider.toObject(),
          profileImage: getFullImageUrl(provider.profileImage),
          reviews: reviews.map(review => ({
            userName: review.user.name,
            rating: review.rating,
            review: review.review,
            createdAt: review.createdAt
          }))
        };
      } catch (err) {
        console.error(`Error fetching reviews for provider ${provider._id}:`, err);
        return {
          ...provider.toObject(),
          profileImage: getFullImageUrl(provider.profileImage),
          reviews: []
        };
      }
    }));
    
    res.status(200).json({
      success: true,
      providers: providersWithReviews
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify Provider - Set isVerified to true
const verifyProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    provider.isVerified = true;
    await provider.save();
    
    res.status(200).json({
      success: true,
      message: 'Provider verified successfully'
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reject Provider - Set isVerified to false and deactivate
const rejectProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    provider.isVerified = false;
    provider.isActive = false;
    await provider.save();
    
    res.status(200).json({
      success: true,
      message: 'Provider rejected successfully'
    });
  } catch (error) {
    console.error('Reject provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create Initial Admin (Run once)
const createInitialAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await Admin.create({
        username: 'admin',
        email: 'admin@servease.com',
        password: 'Admin@123',
        fullName: 'Super Admin',
        role: 'super_admin'
      });
      console.log('✅ Initial admin created');
      console.log('📝 Admin Login Credentials:');
      console.log('   Username: admin');
      console.log('   Password: Admin@123');
      console.log('   Email: admin@servease.com');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllProviders,
  getAllUsers,
  verifyProvider,
  rejectProvider,
  deleteUser,
  createInitialAdmin
};