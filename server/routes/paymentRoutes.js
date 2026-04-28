const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');

// Import controller functions - make sure all are available
const {
  initiateEsewaPayment,
  esewaPaymentSuccess,
  esewaPaymentFailure,
  getPaymentStatus,
  getUserPayments,
  simulatePayment
} = require('../controllers/paymentController');

// User routes (protected)
router.post('/initiate', protectUser, initiateEsewaPayment);
router.get('/status/:bookingId', protectUser, getPaymentStatus);
router.get('/user/payments', protectUser, getUserPayments);

// eSewa callback routes (public - no auth needed)
// These MUST be GET methods as per eSewa documentation
router.get('/esewa/success', esewaPaymentSuccess);
router.get('/esewa/failure', esewaPaymentFailure);

module.exports = router;