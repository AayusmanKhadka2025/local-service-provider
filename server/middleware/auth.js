const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectUser = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      // Check both possible property names (id or userId)
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        console.log('No user ID found in token');
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure'
        });
      }
      
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        console.log('User not found for id:', userId);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log('User authenticated:', { id: user._id, email: user.email, isGoogle: user.isGoogleAccount });
      
      req.userId = user._id;
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

module.exports = { protectUser };