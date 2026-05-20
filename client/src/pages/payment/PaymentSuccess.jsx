import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentId = params.get('paymentId');
    const bookingId = params.get('bookingId');
    const amount = params.get('amount');

    if (paymentId && bookingId) {
      setPaymentDetails({ paymentId, bookingId, amount });
    }

    // Auto redirect to dashboard
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-6">
          Your payment has been processed successfully.
        </p>

        {paymentDetails && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="text-gray-700 font-mono text-sm">
                {paymentDetails.paymentId?.slice(-12)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="text-green-600 font-bold">
                Rs. {paymentDetails.amount}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-400 mb-6">
          Redirecting to dashboard in {countdown} seconds...
        </p>

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;