import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Home } from "lucide-react";
import authImage from "../assets/auth-illustration.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Unified Login API Call - Tries User first, then Provider, then Admin
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setMessage({ type: "error", text: "Email and password are required" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // First try to login as a regular user
      try {
        const userResponse = await axios.post(
          "http://localhost:5050/api/auth/login",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        if (userResponse.data.success) {
          localStorage.setItem("user", JSON.stringify(userResponse.data.user));
          localStorage.setItem("token", userResponse.data.token);
          localStorage.setItem("userType", "user");

          setMessage({
            type: "success",
            text: "Login successful! Redirecting to dashboard...",
          });

          setTimeout(() => {
            navigate("/service-listing");
          }, 1000);
          return;
        }
      } catch (userError) {
        console.log("User login failed, trying provider login...");
      }

      // If user login fails, try provider login
      try {
        const providerResponse = await axios.post(
          "http://localhost:5050/api/providers/login",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        if (providerResponse.data.success) {
          localStorage.setItem(
            "provider",
            JSON.stringify(providerResponse.data.provider)
          );
          localStorage.setItem("providerToken", providerResponse.data.token);
          localStorage.setItem("userType", "provider");

          setMessage({
            type: "success",
            text: "Login successful! Redirecting to dashboard...",
          });

          setTimeout(() => {
            navigate("/provider/dashboard");
          }, 1000);
          return;
        }
      } catch (providerError) {
        console.log("Provider login failed, trying admin login...");
      }

      // If provider login fails, try admin login
      try {
        const adminResponse = await axios.post(
          "http://localhost:5050/api/admin/login",
          {
            username: formData.email, // Admin uses username/email
            password: formData.password,
          }
        );

        if (adminResponse.data.success) {
          localStorage.setItem("admin", JSON.stringify(adminResponse.data.admin));
          localStorage.setItem("adminToken", adminResponse.data.token);
          localStorage.setItem("userType", "admin");

          setMessage({
            type: "success",
            text: "Login successful! Redirecting to dashboard...",
          });

          setTimeout(() => {
            navigate("/admin/dashboard");
          }, 1000);
          return;
        }
      } catch (adminError) {
        console.log("Admin login also failed");
        
        // Check for specific error messages
        if (adminError.response?.status === 403) {
          const errorMsg = adminError.response?.data?.message || "";
          if (errorMsg.includes("deactivated")) {
            setMessage({
              type: "error",
              text: "Your account has been deactivated. Please contact support.",
            });
          } else {
            setMessage({
              type: "error",
              text: "Invalid email or password. Please check your credentials.",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Invalid email or password. Please check your credentials.",
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT - LOGIN FORM */}
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
          <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            Log in to your account to continue
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email or Username
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email or username"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-sm text-blue-600 text-center mt-3 cursor-pointer hover:underline">
            Forgot Password?
          </p>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          {/* Role Selection Links */}
          <div className="mt-5 space-y-2">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT - INFO SECTION */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-blue-600 text-white px-10">
        <img src={authImage} alt="Professional Service" className="w-80 mb-6" />
        <h3 className="text-xl font-semibold">Professional Local Services</h3>
        <p className="text-center text-sm mt-3 max-w-sm">
          Join thousands of professionals who trust ServEase for their local
          service needs. Get started today and experience the difference.
        </p>
      </div>
    </div>
  );
};

export default Login;