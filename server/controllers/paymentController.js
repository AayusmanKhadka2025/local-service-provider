const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const crypto = require('crypto');

// eSewa Configuration
const ESEWA_SANDBOX_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SUCCESS_URL = 'http://localhost:5050/api/payments/esewa/success';
const ESEWA_FAILURE_URL = 'http://localhost:5050/api/payments/esewa/failure';
const ESEWA_MERCHANT_CODE = 'EPAYTEST';
const ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q';

// Generate signature
const getEsewaPaymentHash = ({ amount, transaction_uuid }) => {
  const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_MERCHANT_CODE}`;
  console.log('Message to sign:', data);
  
  const hash = crypto
    .createHmac('sha256', ESEWA_SECRET_KEY)
    .update(data)
    .digest('base64');

  console.log('Generated signature:', hash);
  
  return {
    signature: hash,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };
};

// Generate transaction UUID
const generateTransactionUuid = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
};

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
    const totalAmount = amount;
    
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

    // Prepare data for eSewa
    const esewaData = {
      amount: amount.toString(),
      tax_amount: '0',
      total_amount: totalAmount.toString(),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_CODE,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${ESEWA_SUCCESS_URL}?paymentId=${payment._id}`,
      failure_url: `${ESEWA_FAILURE_URL}?paymentId=${payment._id}`,
      signed_field_names: signed_field_names,
      signature: signature
    };

    console.log('eSewa Payment initiated:', {
      amount,
      totalAmount,
      transactionUuid,
      paymentId: payment._id
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

// eSewa Payment Success Callback - Fixed URL parsing
const esewaPaymentSuccess = async (req, res) => {
  try {
    console.log('=' .repeat(60));
    console.log('ESEWA SUCCESS CALLBACK RECEIVED');
    console.log('Raw URL:', req.url);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('=' .repeat(60));
    
    // Fix: eSewa sometimes appends data to paymentId with another ?
    let paymentId = req.query.paymentId;
    let encodedData = req.query.data;
    
    // Check if paymentId contains a ? which means data is appended to it
    if (paymentId && paymentId.includes('?data=')) {
      const parts = paymentId.split('?data=');
      paymentId = parts[0];
      encodedData = parts[1];
      console.log('Extracted paymentId from malformed URL:', paymentId);
      console.log('Extracted data from malformed URL');
    }
    
    // Also check if data is in the query as expected
    if (!encodedData && req.query.data) {
      encodedData = req.query.data;
    }
    
    // Check if data is in the body
    if (!encodedData && req.body.data) {
      encodedData = req.body.data;
    }
    
    // Find payment by ID first
    let payment = null;
    if (paymentId && paymentId.match(/^[0-9a-fA-F]{24}$/)) {
      payment = await Payment.findById(paymentId);
    }
    
    // If not found by ID, try by transaction_uuid from decoded data
    if (!payment && encodedData) {
      try {
        const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
        console.log('Decoded data from eSewa:', decodedData);
        
        if (decodedData.transaction_uuid) {
          payment = await Payment.findOne({ transactionUuid: decodedData.transaction_uuid });
        }
      } catch (e) {
        console.error('Error decoding data:', e);
      }
    }
    
    if (!payment) {
      console.error('Payment not found for:', { paymentId, hasData: !!encodedData });
      return res.redirect(`http://localhost:5173/payment-failure?error=Payment record not found`);
    }
    
    // Mark payment as successful
    payment.status = 'success';
    payment.completedAt = new Date();
    payment.paymentResponse = { 
      rawQuery: req.query,
      encodedData: encodedData,
      receivedAt: new Date(),
      note: 'Payment successful via eSewa'
    };
    
    if (encodedData) {
      try {
        const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
        payment.paymentResponse.decodedData = decodedData;
      } catch (e) {}
    }
    
    await payment.save();
    console.log('✅ Payment successful for booking:', payment.bookingId);

    // Redirect to frontend success page
    res.redirect(`http://localhost:5173/payment-success?paymentId=${payment._id}&bookingId=${payment.bookingId}&amount=${payment.amount}`);
  } catch (error) {
    console.error('Payment success callback error:', error);
    res.redirect(`http://localhost:5173/payment-failure?error=${encodeURIComponent(error.message)}`);
  }
};

// eSewa Payment Failure Callback - Fixed URL parsing
const esewaPaymentFailure = async (req, res) => {
  try {
    console.log('=' .repeat(60));
    console.log('ESEWA FAILURE CALLBACK RECEIVED');
    console.log('Raw URL:', req.url);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('=' .repeat(60));
    
    let paymentId = req.query.paymentId;
    let errorMsg = req.query.error || 'Payment cancelled or failed';
    
    // Fix: Check if paymentId contains malformed data
    if (paymentId && paymentId.includes('?')) {
      paymentId = paymentId.split('?')[0];
    }
    
    // Find payment
    let payment = null;
    if (paymentId && paymentId.match(/^[0-9a-fA-F]{24}$/)) {
      payment = await Payment.findById(paymentId);
    }
    
    if (payment) {
      payment.status = 'failed';
      payment.paymentResponse = { 
        query: req.query,
        receivedAt: new Date(),
        error: errorMsg
      };
      await payment.save();
      console.log('Payment marked as failed for booking:', payment.bookingId);
    }

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

module.exports = {
  initiateEsewaPayment,
  esewaPaymentSuccess,
  esewaPaymentFailure,
  getPaymentStatus,
  getUserPayments
};