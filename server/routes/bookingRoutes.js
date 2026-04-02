// server/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  startService,
  completeService,
  getProviderNotifications,
  addUserReview
} = require('../controllers/bookingController');

// User routes
router.post('/create', protectUser, createBooking);
router.get('/user', protectUser, getUserBookings);
router.post('/review', protectUser, addUserReview);

// Provider routes
router.get('/provider', protectProvider, getProviderBookings);
router.put('/status', protectProvider, updateBookingStatus);
router.put('/start', protectProvider, startService);
router.put('/complete', protectProvider, completeService);
router.get('/notifications', protectProvider, getProviderNotifications);

module.exports = router;