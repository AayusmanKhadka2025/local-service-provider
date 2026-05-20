import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import UserDashboard from "./pages/user/UserDashboard";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderRegister from "./pages/provider/ProviderRegister";
import ServiceListing from "./pages/booking/ServiceListing";
import BookingPage from "./pages/booking/BookingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import GoogleAuthCallback from "./pages/auth/GoogleAuthCallback";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailure from "./pages/payment/PaymentFailure";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<ProviderRegister />} />

        {/* User Routes - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute userType="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Service Listing Route - Protected */}
        <Route
          path="/service-listing"
          element={
            <ProtectedRoute userType="user">
              <ServiceListing />
            </ProtectedRoute>
          }
        />

        {/* Booking Page Route - Protected */}
        <Route
          path="/provider-details/:id"
          element={
            <ProtectedRoute userType="user">
              <BookingPage />
            </ProtectedRoute>
          }
        />

        {/* Provider Routes - Protected */}
        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute userType="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute userType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/verify-otp" element={<VerifyOTP />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />

        <Route path="/payment-failure" element={<PaymentFailure />} />
      </Routes>
    </Router>
  );
}

export default App;
