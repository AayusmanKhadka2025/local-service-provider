import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import ProviderRegister from "./pages/ProviderRegister";
import ProviderDashboard from "./pages/ProviderDashboard";
import ServiceListing from "./pages/ServiceListing";
import BookingPage from "./pages/BookingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

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
      </Routes>
    </Router>
  );
}

export default App;