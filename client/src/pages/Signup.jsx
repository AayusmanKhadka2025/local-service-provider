import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, CheckCircle, XCircle } from "lucide-react"; // Add CheckCircle and XCircle
import axios from "axios";
import signupImage from "../assets/auth-illustration.png";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Password validation function
  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Validate password in real-time
    if (name === "password") {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.agreeTerms) {
      setMessage({
        type: "error",
        text: "You must agree to the terms and conditions",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    // Validate password strength
    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setMessage({
        type: "error",
        text: "Password does not meet the security requirements",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Send OTP instead of direct registration
      const response = await axios.post(
        "http://localhost:5050/api/auth/send-otp",
        {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
      );

      if (response.data.success) {
        // Store email temporarily and redirect to verification page
        localStorage.setItem("pendingEmail", formData.email);

        setMessage({
          type: "success",
          text: "Verification code sent! Redirecting to verification page...",
        });

        setTimeout(() => {
          navigate("/verify-otp", { state: { email: formData.email } });
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        if (error.response.status === 409) {
          setMessage({
            type: "error",
            text: "An account with this email already exists. Please use a different email.",
          });
        } else if (error.response.data?.errors) {
          // Display password validation errors
          setMessage({
            type: "error",
            text: error.response.data.errors.join(". "),
          });
        } else {
          setMessage({
            type: "error",
            text: error.response.data?.message || "Registration failed",
          });
        }
      } else if (error.request) {
        setMessage({
          type: "error",
          text: "Cannot connect to server. Please try again.",
        });
      } else {
        setMessage({
          type: "error",
          text: "An unexpected error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render validation status
  const renderValidationIcon = (isValid) => {
    if (isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT SIDE - FORM */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Logo - Top Left inside card */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </h2>
          </div>
          <h2 className="text-2xl font-bold text-center">Sign Up</h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            Create your account to continue
          </p>

          {/* Status Message */}
          {message.text && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Google Signup */}
          <button className="w-full mt-4 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field with Validation */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Requirements Box */}
              {formData.password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Password must contain:
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {renderValidationIcon(passwordValidation.minLength)}
                      <span
                        className={`text-xs ${passwordValidation.minLength ? "text-green-600" : "text-gray-500"}`}
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderValidationIcon(passwordValidation.hasUppercase)}
                      <span
                        className={`text-xs ${passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}`}
                      >
                        At least one uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderValidationIcon(passwordValidation.hasLowercase)}
                      <span
                        className={`text-xs ${passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}`}
                      >
                        At least one lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderValidationIcon(passwordValidation.hasNumber)}
                      <span
                        className={`text-xs ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}`}
                      >
                        At least one number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderValidationIcon(passwordValidation.hasSpecialChar)}
                      <span
                        className={`text-xs ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-500"}`}
                      >
                        At least one special character (!@#$%^&* etc.)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1"
                required
                disabled={loading}
              />
              <p>
                I agree to the{" "}
                <span className="text-blue-600 cursor-pointer">
                  Terms and Conditions
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - INFO */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-blue-600 text-white px-10">
        <img
          src={signupImage}
          alt="Professional Service"
          className="w-80 mb-6"
        />
        <h3 className="text-xl font-semibold">Professional Local Services</h3>
        <p className="text-center text-sm mt-3 max-w-sm">
          Join thousands of professionals who trust ServEase for their local
          service needs. Get started today and experience the difference.
        </p>
      </div>
    </div>
  );
};

export default Signup;
