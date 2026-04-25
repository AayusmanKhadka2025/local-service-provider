const crypto = require('crypto');

// eSewa Sandbox Configuration
const ESEWA_SANDBOX_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SUCCESS_URL = 'http://localhost:5050/api/payments/esewa/success';
const ESEWA_FAILURE_URL = 'http://localhost:5050/api/payments/esewa/failure';
const ESEWA_MERCHANT_CODE = 'EPAYTEST';
// IMPORTANT: The secret key from the blog - note the '/q' at the end
const ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q';

// Generate signature - exactly as per blog
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

// Generate transaction UUID (use MongoDB ObjectId format)
const generateTransactionUuid = () => {
  // Generate a 24-character hex string like MongoDB ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = Math.random().toString(16).substring(2, 18);
  return (timestamp + random).substring(0, 24);
};

// Verify eSewa payment (as per blog)
const verifyEsewaPayment = async (encodedData) => {
  try {
    // Decoding base64 code received from eSewa
    let decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    decodedData = JSON.parse(decodedData);
    console.log('Decoded data:', decodedData);
    
    // Build data string for signature verification
    const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${ESEWA_MERCHANT_CODE},signed_field_names=${decodedData.signed_field_names}`;
    
    const hash = crypto
      .createHmac('sha256', ESEWA_SECRET_KEY)
      .update(data)
      .digest('base64');
    
    console.log('Calculated hash:', hash);
    console.log('Received signature:', decodedData.signature);
    
    if (hash !== decodedData.signature) {
      throw new Error('Invalid signature');
    }
    
    // Verify transaction status with eSewa
    const axios = require('axios');
    const statusUrl = `${process.env.ESEWA_GATEWAY_URL || 'https://rc.esewa.com.np'}/api/epay/transaction/status/?product_code=${ESEWA_MERCHANT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
    
    console.log('Status check URL:', statusUrl);
    
    const response = await axios.get(statusUrl);
    console.log('Status check response:', response.data);
    
    if (response.data.status !== 'COMPLETE') {
      throw new Error('Payment not complete');
    }
    
    return { response: response.data, decodedData };
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

module.exports = {
  ESEWA_SANDBOX_URL,
  ESEWA_SUCCESS_URL,
  ESEWA_FAILURE_URL,
  ESEWA_MERCHANT_CODE,
  ESEWA_SECRET_KEY,
  getEsewaPaymentHash,
  generateTransactionUuid,
  verifyEsewaPayment
};