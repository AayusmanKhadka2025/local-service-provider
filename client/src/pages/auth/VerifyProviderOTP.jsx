import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Home, Mail, CheckCircle, AlertCircle, RefreshCw, ArrowRight, Briefcase } from "lucide-react";

const VerifyProviderOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    // Get email from location state or localStorage
    const storedEmail = location.state?.email || localStorage.getItem("pendingProviderEmail");
    if (!storedEmail) {
      navigate("/register");
      return;
    }
    setEmail(storedEmail);
    localStorage.setItem("pendingProviderEmail", storedEmail);

    // Start countdown timer for resend
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Handle redirect countdown after successful verification
  useEffect(() => {
    if (verificationSuccess && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationSuccess && redirectCountdown === 0) {
      // Clear pending email from localStorage
      localStorage.removeItem("pendingProviderEmail");
      sessionStorage.removeItem("pendingProviderData");
      sessionStorage.removeItem("pendingProviderDays");
      sessionStorage.removeItem("pendingProviderTags");
      
      // Redirect to login page
      navigate("/login", { 
        state: { 
          message: "Provider account created successfully! Please wait for admin approval before logging in.",
          email: email 
        } 
      });
    }
  }, [verificationSuccess, redirectCountdown, navigate, email]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit code" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Get stored form data
      const storedData = sessionStorage.getItem("pendingProviderData");
      const storedDays = sessionStorage.getItem("pendingProviderDays");
      const storedTags = sessionStorage.getItem("pendingProviderTags");
      
      if (!storedData) {
        throw new Error("Registration data not found. Please register again.");
      }
      
      const formDataObj = JSON.parse(storedData);
      const selectedDays = storedDays ? JSON.parse(storedDays) : [];
      const selectedTags = storedTags ? JSON.parse(storedTags) : [];
      
      // Create FormData for final registration
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formDataObj).forEach(key => {
        const value = formDataObj[key];
        if (value && typeof value === 'object' && value._isFile) {
          // File will need to be re-uploaded from the original file input
          // For now, we'll need to get the file from the original input
          // This is a limitation - better to handle file uploads before OTP
          console.log('File detected:', key, value.name);
        } else if (value && typeof value !== 'object') {
          formDataToSend.append(key, value);
        }
      });
      
      formDataToSend.append("availableDays", JSON.stringify(selectedDays));
      formDataToSend.append("serviceTags", JSON.stringify(selectedTags));
      formDataToSend.append("email", email);
      formDataToSend.append("otp", otpCode);
      
      const response = await axios.post(
        "http://localhost:5050/api/providers/verify-otp",
        { email, otp: otpCode }
      );

      if (response.data.success) {
        setMessage({ 
          type: "success", 
          text: response.data.message || "Provider account created successfully! Please wait for admin approval." 
        });
        setVerificationSuccess(true);
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Invalid verification code. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post("http://localhost:5050/api/providers/resend-otp", {
        email
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "New verification code sent to your email!" });
        setTimer(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        
        const interval = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Resend error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to resend code. Please try again."
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </h1>
          </div>
          <p className="text-gray-500 text-sm">Service Provider Registration</p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {verificationSuccess ? "Registration Complete!" : "Verify Your Email"}
          </h2>
          {!verificationSuccess && (
            <p className="text-gray-500 mt-2 text-sm">
              We've sent a 6-digit verification code to
              <br />
              <span className="font-medium text-blue-600">{email}</span>
            </p>
          )}
        </div>

        {/* Success Message with Redirect Countdown */}
        {verificationSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium mb-2">
              Your email has been verified successfully!
            </p>
            <p className="text-green-600 text-sm">
              Your provider account has been created. You will be redirected to the login page in <strong>{redirectCountdown}</strong> seconds.
            </p>
            <p className="text-amber-600 text-xs mt-2">
              Note: Your account requires admin approval before you can log in.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("pendingProviderEmail");
                sessionStorage.removeItem("pendingProviderData");
                navigate("/login", { 
                  state: { 
                    message: "Provider account created successfully! Please wait for admin approval before logging in.",
                    email: email 
                  } 
                });
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Go to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message */}
        {message.text && !verificationSuccess && (
          <div
            className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* OTP Input Form - Only show if not verified yet */}
        {!verificationSuccess && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus={index === 0}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify & Create Account"
              )}
            </button>

            {/* Resend Section */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn't receive the code?{" "}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Code
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-gray-400">
                    Resend available in {timer} seconds
                  </span>
                )}
              </p>
            </div>
          </form>
        )}

        {/* Back to Registration */}
        {!verificationSuccess && (
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-sm text-gray-500 hover:text-gray-700 transition"
              onClick={() => localStorage.removeItem("pendingProviderEmail")}
            >
              ← Back to Registration
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyProviderOTP;