const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const {
  ESEWA_SANDBOX_URL,
  ESEWA_MERCHANT_CODE,
  ESEWA_SUCCESS_URL,
  ESEWA_FAILURE_URL,
  getEsewaPaymentHash,
  generateTransactionUuid,
  verifyEsewaPayment
} = require('../config/esewa');

// Initiate eSewa payment
const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    console.log('Initiating eSewa payment for booking:', bookingId);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for completed bookings'
      });
    }

    const existingPayment = await Payment.findOne({ 
      bookingId: bookingId,
      status: 'success'
    });
    
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    const amount = Math.round(booking.calculatedAmount || booking.totalAmount);
    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;
    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
    
    // Generate transaction UUID (MongoDB ObjectId format)
    const transactionUuid = generateTransactionUuid();

    // Create pending payment record
    const payment = await Payment.create({
      bookingId: booking._id,
      userId: userId,
      providerId: booking.provider.providerId,
      transactionUuid: transactionUuid,
      amount: totalAmount,
      status: 'pending'
    });

    // Get eSewa payment hash
    const { signature, signed_field_names } = getEsewaPaymentHash({
      amount: totalAmount,
      transaction_uuid: transactionUuid
    });

    // Prepare data exactly as per eSewa documentation
    const esewaData = {
      amount: amount.toString(),
      tax_amount: taxAmount.toString(),
      total_amount: totalAmount.toString(),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_CODE,
      product_service_charge: serviceCharge.toString(),
      product_delivery_charge: deliveryCharge.toString(),
      success_url: `${ESEWA_SUCCESS_URL}?paymentId=${payment._id}`,
      failure_url: `${ESEWA_FAILURE_URL}?paymentId=${payment._id}`,
      signed_field_names: signed_field_names,
      signature: signature
    };

    console.log('eSewa Payment Data:', {
      amount,
      totalAmount,
      transactionUuid,
      signature: signature.substring(0, 20) + '...',
      success_url: esewaData.success_url
    });

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      paymentId: payment._id,
      esewaData: esewaData,
      esewaUrl: ESEWA_SANDBOX_URL
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// eSewa Payment Success Callback
const esewaPaymentSuccess = async (req, res) => {
  try {
    console.log('=' .repeat(50));
    console.log('ESEWA SUCCESS CALLBACK');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    console.log('=' .repeat(50));
    
    let paymentId = req.query.paymentId;
    let encodedData = req.query.data || req.body.data;
    
    if (!encodedData) {
      console.error('No data received from eSewa');
      return res.redirect(`http://localhost:5173/payment-failure?error=No payment data received`);
    }
    
    // Verify payment with eSewa
    const verificationResult = await verifyEsewaPayment(encodedData);
    console.log('Verification result:', verificationResult);
    
    let payment = null;
    
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else if (verificationResult.response.transaction_uuid) {
      payment = await Payment.findOne({ transactionUuid: verificationResult.response.transaction_uuid });
    }
    
    if (!payment) {
      console.error('Payment not found');
      return res.redirect(`http://localhost:5173/payment-failure?error=Payment record not found`);
    }
    
    // Update payment status
    payment.status = 'success';
    payment.completedAt = new Date();
    payment.paymentResponse = verificationResult;
    await payment.save();

    console.log('✅ Payment successful for booking:', payment.bookingId);

    // Redirect to frontend success page
    res.redirect(`http://localhost:5173/payment-success?paymentId=${payment._id}&bookingId=${payment.bookingId}&amount=${payment.amount}`);
  } catch (error) {
    console.error('Payment success callback error:', error);
    res.redirect(`http://localhost:5173/payment-failure?error=${encodeURIComponent(error.message)}`);
  }
};

// eSewa Payment Failure Callback
const esewaPaymentFailure = async (req, res) => {
  try {
    console.log('=' .repeat(50));
    console.log('ESEWA FAILURE CALLBACK');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    console.log('=' .repeat(50));
    
    const paymentId = req.query.paymentId;
    
    let payment = null;
    
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    }
    
    if (payment) {
      payment.status = 'failed';
      payment.paymentResponse = { 
        query: req.query,
        body: req.body,
        receivedAt: new Date()
      };
      await payment.save();
      console.log('Payment marked as failed for booking:', payment.bookingId);
    }

    const errorMsg = req.query.error || 'Payment cancelled or failed';
    res.redirect(`http://localhost:5173/payment-failure?error=${encodeURIComponent(errorMsg)}`);
  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.redirect(`http://localhost:5173/payment-failure?error=${encodeURIComponent(error.message)}`);
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const payment = await Payment.findOne({ bookingId: bookingId });
    
    res.status(200).json({
      success: true,
      hasPayment: !!payment,
      payment: payment ? {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        transactionUuid: payment.transactionUuid,
        completedAt: payment.completedAt
      } : null
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all payments for a user
const getUserPayments = async (req, res) => {
  try {
    const userId = req.userId;
    const payments = await Payment.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      payments: payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Simulate payment for testing
const simulatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made for completed bookings'
      });
    }

    const existingPayment = await Payment.findOne({ 
      bookingId: bookingId,
      status: 'success'
    });
    
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    const amount = booking.calculatedAmount || booking.totalAmount;
    const transactionUuid = generateTransactionUuid();

    const payment = await Payment.create({
      bookingId: booking._id,
      userId: userId,
      providerId: booking.provider.providerId,
      transactionUuid: transactionUuid,
      amount: amount,
      status: 'success',
      completedAt: new Date(),
      paymentResponse: { simulated: true }
    });

    console.log('Simulated payment successful for booking:', bookingId);

    res.status(200).json({
      success: true,
      message: 'Payment simulated successfully',
      payment: {
        id: payment._id,
        amount: payment.amount,
        transactionUuid: payment.transactionUuid,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  initiateEsewaPayment,
  esewaPaymentSuccess,
  esewaPaymentFailure,
  getPaymentStatus,
  getUserPayments,
  simulatePayment
};