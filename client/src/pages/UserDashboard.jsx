// client/src/pages/UserDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bell,
  LogOut,
  LayoutDashboard,
  CalendarPlus,
  User,
  HelpCircle,
  XCircle,
  ChevronRight,
  Home,
  Clock,
  CheckCircle,
  Star,
  PlusCircle,
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  MessageSquare,
  Calendar,
  AlertCircle,
  ThumbsUp,
  Award,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ProfileSettings from "./ProfileSettings";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "https://i.pravatar.cc/100?u=default",
  });
  const [bookings, setBookings] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(true);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    upcoming: false,
    history: false,
  });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");

      if (!storedUser || !token || userType !== "user") {
        navigate("/login");
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        let avatarUrl = userData.avatar;
        if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
          avatarUrl = `http://localhost:5050${avatarUrl}`;
        } else if (!avatarUrl) {
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || "User")}&background=3b82f6&color=fff&size=100`;
        }

        setUser({
          name: userData.fullName || userData.name || "User",
          email: userData.email || "",
          avatar: avatarUrl,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    };

    loadUserData();
  }, [navigate]);

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5050/api/bookings/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        showToast("Failed to load bookings", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    let avatarUrl = updatedUser.avatar;
    if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
      avatarUrl = `http://localhost:5050${avatarUrl}`;
    }
    setUser({
      name: updatedUser.fullName || updatedUser.name,
      email: updatedUser.email,
      avatar: avatarUrl,
    });
  };

  const handleNewBookingClick = () => {
    navigate("/service-listing");
  };

  // Cancel booking (only if pending)
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5050/api/bookings/cancel",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookings(updatedBookings.data.bookings);
        showToast("Booking cancelled successfully", "success");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showToast(error.response?.data?.message || "Failed to cancel booking", "error");
    }
  };

  // Open provider details modal
  const handleProviderClick = (provider, bookingDetails) => {
    setSelectedProvider({ ...provider, bookingDetails });
    setShowProviderModal(true);
  };

  // Open review modal for completed booking
  const handleReviewClick = (booking) => {
    if (booking.rating && booking.rating !== null) {
      showToast("You have already reviewed this booking", "info");
      return;
    }
    setSelectedBookingForReview(booking);
    setRatingValue(5);
    setReviewText("");
    setShowReviewModal(true);
  };

  // Submit review
  const submitReview = async () => {
    if (!selectedBookingForReview) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5050/api/bookings/review",
        {
          bookingId: selectedBookingForReview._id,
          rating: ratingValue,
          review: reviewText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookings(updatedBookings.data.bookings);
        setShowReviewModal(false);
        showToast("Review submitted successfully! Thank you for your feedback.", "success");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast(error.response?.data?.message || "Failed to submit review", "error");
    }
  };

  // Get provider image URL
  const getProviderImage = (provider) => {
    if (provider.avatar) return provider.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=3b82f6&color=fff&size=100&bold=true`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (date) => {
    if (!date) return "Not started";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (amount) => {
    return `Rs. ${amount}`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get visible bookings based on expanded state
  const getVisibleBookings = (bookingsList, isExpanded, itemsToShow = 4) => {
    if (isExpanded) return bookingsList;
    return bookingsList.slice(0, itemsToShow);
  };

  // Check if section has more than 4 items
  const hasMoreThanFour = (bookingsList) => bookingsList.length > 4;

  // Filter bookings by status
  const upcomingBookingsList = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );
  
  const historyBookingsList = bookings.filter(
    (b) => b.status === "completed" || b.status === "rejected" || b.status === "cancelled"
  );

  // Statistics
  const totalBookings = bookings.length;
  const upcomingCount = upcomingBookingsList.length;
  const completedCount = bookings.filter(b => b.status === "completed").length;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: CalendarPlus, color: "blue" },
    { label: "Upcoming Bookings", value: upcomingCount, icon: Clock, color: "yellow" },
    { label: "Completed Bookings", value: completedCount, icon: CheckCircle, color: "green" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      confirmed: "bg-green-100 text-green-700 border-green-200",
      in_progress: "bg-purple-100 text-purple-700 border-purple-200",
      completed: "bg-blue-100 text-blue-700 border-blue-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Completed",
      rejected: "Rejected by Provider",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
    { id: "support", label: "Help & Support", icon: HelpCircle },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  // Render Upcoming Bookings Section
  const renderUpcomingSection = () => {
    const isExpanded = expandedSections.upcoming;
    const visibleBookings = getVisibleBookings(upcomingBookingsList, isExpanded);
    const showViewAll = hasMoreThanFour(upcomingBookingsList);
    const isEmpty = upcomingBookingsList.length === 0;

    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Upcoming Bookings
          </h2>
          {showViewAll && (
            <button
              onClick={() => toggleSection("upcoming")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-all duration-300 hover:translate-x-1"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View All ({upcomingBookingsList.length}){" "}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-md font-medium text-gray-700 mb-1">No upcoming bookings</h3>
            <p className="text-sm text-gray-500">
              When you book a service, it will appear here.
            </p>
            <button
              onClick={handleNewBookingClick}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Book a Service
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                type="upcoming"
                onCancel={() => handleCancelBooking(booking._id)}
                onProviderClick={() => handleProviderClick(booking.provider, booking)}
                getProviderImage={getProviderImage}
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                renderStars={renderStars}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  // Render Recent Booking History Section
  const renderHistorySection = () => {
    const isExpanded = expandedSections.history;
    const visibleBookings = getVisibleBookings(historyBookingsList, isExpanded);
    const showViewAll = hasMoreThanFour(historyBookingsList);
    const isEmpty = historyBookingsList.length === 0;

    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Booking History
          </h2>
          {showViewAll && (
            <button
              onClick={() => toggleSection("history")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-all duration-300 hover:translate-x-1"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View All ({historyBookingsList.length}){" "}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-md font-medium text-gray-700 mb-1">No booking history</h3>
            <p className="text-sm text-gray-500">
              Completed, rejected, or cancelled bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                type="history"
                onReview={() => handleReviewClick(booking)}
                onProviderClick={() => handleProviderClick(booking.provider, booking)}
                getProviderImage={getProviderImage}
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                renderStars={renderStars}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Toast Notification */}
            {toast.show && (
              <div className="fixed top-5 right-5 z-50 animate-slide-in">
                <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
                  toast.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}>
                  {toast.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}>
                    {toast.message}
                  </p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const colors = {
                  blue: "from-blue-500 to-blue-400",
                  yellow: "from-yellow-500 to-yellow-400",
                  green: "from-green-500 to-green-400",
                };
                return (
                  <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className={`w-12 h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center shadow-lg mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <h2 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h2>
                  </div>
                );
              })}
            </div>

            {/* Upcoming Bookings Section */}
            {renderUpcomingSection()}

            {/* Recent Booking History Section */}
            {renderHistorySection()}
          </>
        );

      case "profile":
        return <ProfileSettings onProfileUpdate={handleProfileUpdate} />;

      case "support":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Help & Support</h2>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">• How do I book a service?</li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">• What is your cancellation policy?</li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">• How are service providers verified?</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Contact Support</h3>
                <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition">
                  Contact Support Team
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Provider Details Modal */}
      {showProviderModal && selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          booking={selectedProvider.bookingDetails}
          onClose={() => setShowProviderModal(false)}
          getProviderImage={getProviderImage}
          formatDate={formatDate}
          formatTime={formatTime}
          formatPrice={formatPrice}
          renderStars={renderStars}
          getStatusLabel={getStatusLabel}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          ratingValue={ratingValue}
          setRatingValue={setRatingValue}
          reviewText={reviewText}
          setReviewText={setReviewText}
          onSubmit={submitReview}
          onClose={() => setShowReviewModal(false)}
          renderStars={renderStars}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur-sm flex-col p-6 fixed left-0 top-0 h-screen border-r border-gray-200 shadow-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">ServEase</h2>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6 border border-blue-100">
          <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" alt={user.name} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-blue-600 font-medium truncate">{user.email}</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </aside>

      <main className="flex-1 ml-0 md:ml-72 overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {activeTab === "profile" ? "Profile Settings" : `Welcome back, ${user.name.split(" ")[0]}! 👋`}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === "profile" ? "Manage your personal details" : "Here's what's happening with your bookings"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleNewBookingClick} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md">
                <PlusCircle className="w-5 h-5" />
                <span>New Booking</span>
              </button>
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {upcomingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                    {upcomingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">{renderContent()}</div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// Booking Card Component
const BookingCard = ({
  booking,
  type,
  onCancel,
  onReview,
  onProviderClick,
  getProviderImage,
  formatDate,
  formatTime,
  formatPrice,
  getStatusColor,
  getStatusLabel,
  renderStars,
}) => {
  const statusColor = getStatusColor(booking.status);
  const statusLabel = getStatusLabel(booking.status);
  const canCancel = booking.status === "pending";
  const canReview = booking.status === "completed" && (!booking.rating || booking.rating === null);
  const hasReviewed = booking.rating && booking.rating !== null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onProviderClick} className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 hover:scale-105 transition cursor-pointer">
              <img src={getProviderImage(booking.provider)} className="w-full h-full object-cover" alt={booking.provider.name} />
            </button>
            <div>
              <button onClick={onProviderClick} className="font-semibold text-gray-800 hover:text-blue-600 transition text-left">
                {booking.provider.name}
              </button>
              <p className="text-xs text-blue-600">{booking.service}</p>
            </div>
          </div>
          <div className="space-y-1 ml-15">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(booking.date)}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{booking.time}</span>
            </div>
            {booking.startTime && (
              <p className="text-xs text-gray-500">Started: {formatTime(booking.startTime)}</p>
            )}
            {booking.endTime && (
              <p className="text-xs text-gray-500">Completed: {formatTime(booking.endTime)}</p>
            )}
            {booking.duration > 0 && (
              <p className="text-xs text-gray-500">Duration: {booking.duration.toFixed(2)} hours</p>
            )}
          </div>
        </div>

        <div className="text-right min-w-[160px]">
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
            <CheckCircle className="w-3 h-3" />
            {statusLabel}
          </span>
          <p className="text-lg font-bold text-gray-800 mt-2">
            {booking.calculatedAmount > 0 ? formatPrice(booking.calculatedAmount) : formatPrice(booking.totalAmount)}
          </p>
          
          {type === "upcoming" && canCancel && (
            <button onClick={onCancel} className="mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-1 mx-auto">
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}

          {type === "history" && canReview && (
            <button onClick={onReview} className="mt-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center gap-1 mx-auto">
              <ThumbsUp className="w-4 h-4" />
              Write a Review
            </button>
          )}

          {type === "history" && hasReviewed && (
            <div className="mt-2">
              {renderStars(booking.rating)}
              {booking.review && (
                <div className="text-left mt-1 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 italic">"{booking.review}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Provider Modal Component
const ProviderModal = ({ provider, booking, onClose, getProviderImage, formatDate, formatTime, formatPrice, renderStars, getStatusLabel, getStatusColor }) => {
  const statusColor = getStatusColor(booking.status);
  const statusLabel = getStatusLabel(booking.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">Provider Details</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <img src={getProviderImage(provider)} className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover" alt={provider.name} />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{provider.name}</h4>
              <p className="text-sm text-blue-600">{provider.category}</p>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(provider.rating || 0)}
                <span className="text-xs text-gray-500 ml-1">({provider.totalReviews || 0} reviews)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Booking Details
            </h5>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium text-gray-700">Service:</span> {booking.service}</p>
              <p className="text-sm"><span className="font-medium text-gray-700">Date & Time:</span> {formatDate(booking.date)} at {booking.time}</p>
              <p className="text-sm"><span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              </p>
              {booking.startTime && (
                <p className="text-sm"><span className="font-medium text-gray-700">Started:</span> {formatTime(booking.startTime)}</p>
              )}
              {booking.endTime && (
                <p className="text-sm"><span className="font-medium text-gray-700">Completed:</span> {formatTime(booking.endTime)}</p>
              )}
              {booking.duration > 0 && (
                <p className="text-sm"><span className="font-medium text-gray-700">Duration:</span> {booking.duration.toFixed(2)} hours</p>
              )}
              {booking.calculatedAmount > 0 && (
                <p className="text-sm"><span className="font-medium text-gray-700">Total Amount:</span> {formatPrice(booking.calculatedAmount)}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              About Provider
            </h5>
            <p className="text-sm text-gray-600">{provider.description || "Professional service provider dedicated to quality work and customer satisfaction."}</p>
            {provider.experience && (
              <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Experience:</span> {provider.experience}</p>
            )}
            {provider.hourlyRate && (
              <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Hourly Rate:</span> Rs. {provider.hourlyRate}/hr</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({ booking, ratingValue, setRatingValue, reviewText, setReviewText, onSubmit, onClose, renderStars }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">Rate Your Experience</h3>
              <p className="text-sm text-blue-100 mt-1">How was the service?</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{booking.provider.name}</h4>
              <p className="text-sm text-gray-500">{booking.service}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= ratingValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              rows="4"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this provider..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            onClick={onSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;