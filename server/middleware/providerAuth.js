const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');

// Protect provider routes
const protectProvider = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const provider = await Provider.findById(decoded.id).select('-password');
      if (!provider) {
        return res.status(401).json({
          success: false,
          message: 'Provider not found'
        });
      }

      if (!provider.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      req.provider = provider;
      req.providerId = provider._id;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Provider auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { protectProvider };