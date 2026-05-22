import { useState } from 'react';
import axios from 'axios';
import { CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const PaymentButton = ({ booking, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const amount = booking.calculatedAmount || booking.totalAmount;

  const handleEsewaPayment = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5050/api/payments/initiate',
        { bookingId: booking._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Payment initiation response:', response.data);

      if (response.data.success) {
        const { esewaData, esewaUrl } = response.data;
        
        // Create and submit form to eSewa
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = esewaUrl;
        form.target = '_blank';
        
        // Add all form fields
        Object.keys(esewaData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = esewaData[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to initiate payment'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to initiate payment. Please try again.'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Message Display */}
      {message.text && (
        <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 text-xs ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* eSewa Payment Button - Green color for eSewa branding */}
      <button
        onClick={handleEsewaPayment}
        disabled={loading}
        className="w-full py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-xs font-medium hover:from-green-700 hover:to-green-600 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay Rs. {amount} 
          </>
        )}
      </button>
    </>
  );
};

export default PaymentButton;