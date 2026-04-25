import { useState } from 'react';
import axios from 'axios';
import { CreditCard, AlertCircle, CheckCircle, Loader, Wallet } from 'lucide-react';

const PaymentButton = ({ booking, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showOptions, setShowOptions] = useState(false);

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
        
        setShowOptions(false);
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

  const handleSimulatePayment = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5050/api/payments/simulate',
        { bookingId: booking._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Payment completed successfully! (Demo Mode)'
        });
        setShowDemoModal(false);
        setShowOptions(false);
        if (onPaymentComplete) {
          onPaymentComplete(response.data.payment);
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Simulated payment error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to process payment'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Demo Payment Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <h3 className="text-xl font-bold">Demo Payment Mode</h3>
              <p className="text-blue-100 text-sm mt-1">Testing Environment Only</p>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Demo Mode Notice</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is a simulated payment for demonstration purposes. No real money will be transferred.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-gray-800">Rs. {amount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulatePayment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Payment Button - Dropdown Style */}
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={loading}
          className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-xs font-medium hover:from-purple-700 hover:to-purple-600 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Pay Rs. {amount}
            </>
          )}
        </button>

        {/* Dropdown Options */}
        {showOptions && !loading && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10 animate-fadeIn">
            <button
              onClick={handleEsewaPayment}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
            >
              <CreditCard className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Pay with eSewa</p>
                <p className="text-xs text-gray-400">Redirect to eSewa sandbox</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowOptions(false);
                setShowDemoModal(true);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
            >
              <Wallet className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Demo Payment</p>
                <p className="text-xs text-gray-400">Simulated payment for testing</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default PaymentButton;