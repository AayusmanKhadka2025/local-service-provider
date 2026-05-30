import { Link } from "react-router-dom";
import { Ban, Home, Mail, Phone, AlertTriangle } from "lucide-react";

const SuspendedAccount = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Ban className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Account Suspended
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 text-left">
              Your account has been suspended by the administrator. 
              Please contact our support team for assistance.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </Link>
          
          <a
            href="mailto:servease2082@gmail.com"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <Mail className="w-4 h-4" />
            Contact Support via Email
          </a>
          
          <a
            href="tel:+9779812021764"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition"
          >
            <Phone className="w-4 h-4" />
            Call Support: +977 9812021764
          </a>
        </div>
        
        <p className="text-xs text-gray-400 mt-6">
          Our support team is available Monday to Friday, 9AM - 6PM
        </p>
      </div>
    </div>
  );
};

export default SuspendedAccount;