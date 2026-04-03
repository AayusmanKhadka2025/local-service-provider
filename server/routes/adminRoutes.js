const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/adminAuth');
const {
  adminLogin,
  getDashboardStats,
  getAllProviders,
  getAllUsers,
  verifyProvider,
  rejectProvider,
  deleteUser
} = require('../controllers/adminController');

// Public route
router.post('/login', adminLogin);

// Protected routes (require authentication)
router.use(protectAdmin);
router.get('/stats', getDashboardStats);
router.get('/providers', getAllProviders);
router.get('/users', getAllUsers);
router.put('/providers/:providerId/verify', protectAdmin, verifyProvider);
router.put('/providers/:providerId/reject', protectAdmin, rejectProvider);
router.delete('/users/:userId', deleteUser);

module.exports = router;