const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');

// Import controller functions
const {
  initiateEsewaPayment,
  esewaPaymentSuccess,
  esewaPaymentFailure,
  getPaymentStatus,
  getUserPayments
} = require('../controllers/paymentController');

// User routes (protected)
router.post('/initiate', protectUser, initiateEsewaPayment);
router.get('/status/:bookingId', protectUser, getPaymentStatus);
router.get('/user/payments', protectUser, getUserPayments);

// eSewa callback routes (public - no auth needed)
router.get('/esewa/success/:paymentId', esewaPaymentSuccess);
router.get('/esewa/failure/:paymentId', esewaPaymentFailure);

module.exports = router;