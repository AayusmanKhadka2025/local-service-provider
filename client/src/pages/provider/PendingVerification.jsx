import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Clock, 
  Mail, 
  CheckCircle, 
  Home, 
  Briefcase,
  ArrowLeft
} from "lucide-react";

const PendingVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get email from location state
    const userEmail = location.state?.email;
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [location]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
       {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            ServEase
          </h1>
          <p className="text-gray-500 text-sm mt-1">Premium Local Service Platform</p>
        </div>


        {/* Icon */}
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-yellow-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Account Pending Verification
        </h2>

        {/* Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm leading-relaxed">
            Your account is yet to be verified. We will notify you through email once the verification is complete.
          </p>
        </div>

        {/* Email Info */}
        {email && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
            <Mail className="w-4 h-4 text-blue-500" />
            <span>We'll send confirmation to: </span>
            <span className="font-medium text-blue-600">{email}</span>
          </div>
        )}

        {/* What to expect */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-3">What happens next?</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-600">Admin will review your documents and information</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-600">You'll receive an email once verification is complete</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-600">After verification, you can log in and start accepting bookings</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleGoToHome}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={handleGoToLogin}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-400 mt-6">
          Having trouble? Contact us at{" "}
          <a href="mailto:servease2082@gmail.com" className="text-blue-600 hover:underline">
            servease2082@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PendingVerification;