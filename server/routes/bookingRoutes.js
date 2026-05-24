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
  cancelBooking,
  getProviderNotifications,
  addUserReview,
  getProviderReviews,
  editUserReview,
  reportReview
} = require('../controllers/bookingController');

// User routes
router.post('/create', protectUser, createBooking);
router.get('/user', protectUser, getUserBookings);
router.post('/review', protectUser, addUserReview);
router.put('/cancel', protectUser, cancelBooking);

// Provider routes
router.get('/provider', protectProvider, getProviderBookings);
router.put('/status', protectProvider, updateBookingStatus);
router.put('/start', protectProvider, startService);
router.put('/complete', protectProvider, completeService);
router.put('/review/edit', protectUser, editUserReview);
router.get('/notifications', protectProvider, getProviderNotifications);
router.get('/provider/reviews/:providerId', getProviderReviews);
router.post('/review/report', protectProvider, reportReview);



module.exports = router;