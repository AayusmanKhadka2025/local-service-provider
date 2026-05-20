import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-500 mb-4">
          Your payment could not be processed.
        </p>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          If the amount was deducted from your account, it will be refunded within 7-10 business days.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailure;