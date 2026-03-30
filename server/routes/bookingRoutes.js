const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  getProviderNotifications
} = require('../controllers/bookingController');

// User routes
router.post('/create', protectUser, createBooking);
router.get('/user', protectUser, getUserBookings);

// Provider routes
router.get('/provider', protectProvider, getProviderBookings);
router.put('/status', protectProvider, updateBookingStatus);
router.get('/notifications', protectProvider, getProviderNotifications);

module.exports = router;