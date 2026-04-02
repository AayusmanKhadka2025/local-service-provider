// client/src/pages/ProviderDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  DollarSign,
  User,
  HelpCircle,
  LogOut,
  Bell,
  ChevronRight,
  Home,
  CheckCircle,
  XCircle,
  Star,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Briefcase,
  X,
  MessageSquare,
  Mail,
  Camera,
  ThumbsUp,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
} from "lucide-react";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState({
    pending: [],
    confirmed: [],
    in_progress: [],
    completed: [],
    rejected: [],
    cancelled: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    pending: false,
    confirmed: false,
    in_progress: false,
    history: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [provider, setProvider] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Service Provider",
    avatar: "",
    rating: 0,
    category: "",
    experience: "",
    description: "",
    availableDays: [],
    address: "",
    city: "",
    hourlyRate: 0,
    serviceArea: "",
    serviceTags: [],
  });

  // Status labels mapping
  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed - Ready to Start",
    in_progress: "Service In Progress",
    completed: "Completed",
    rejected: "Rejected by Provider",
    cancelled: "Cancelled by User",
  };

  const statusColors = {
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-purple-100 text-purple-700 border-purple-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Load provider data from localStorage
  useEffect(() => {
    const loadProviderData = () => {
      const storedProvider = localStorage.getItem("provider");
      const providerToken = localStorage.getItem("providerToken");
      const userType = localStorage.getItem("userType");

      if (!storedProvider || !providerToken || userType !== "provider") {
        navigate("/login");
        return;
      }

      try {
        const providerData = JSON.parse(storedProvider);
        setProvider({
          firstName: providerData.firstName || "",
          lastName: providerData.lastName || "",
          fullName:
            `${providerData.firstName || ""} ${providerData.lastName || ""}`.trim(),
          email: providerData.email || "",
          phone: providerData.phone || "",
          role: "Service Provider",
          avatar:
            providerData.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(providerData.firstName || "Provider")}&background=3b82f6&color=fff&size=100`,
          rating: providerData.rating || 0,
          category: providerData.category || "",
          experience: providerData.experience || "",
          description: providerData.description || "",
          availableDays: providerData.availableDays || [],
          address: providerData.address || "",
          city: providerData.city || "",
          hourlyRate: providerData.hourlyRate || 0,
          serviceArea: providerData.serviceArea || "",
          serviceTags: providerData.serviceTags || [],
        });
      } catch (error) {
        console.error("Error parsing provider data:", error);
        navigate("/login");
      }
    };

    loadProviderData();
  }, [navigate]);

  // Fetch provider bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("providerToken");
        const response = await axios.get(
          "http://localhost:5050/api/bookings/provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "profile", label: "Profile", icon: User },
    { id: "support", label: "Help & Support", icon: HelpCircle },
  ];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateBookingStatus = async (bookingId, status, actionMessage) => {
    try {
      const token = localStorage.getItem("providerToken");
      const response = await axios.put(
        "http://localhost:5050/api/bookings/status",
        { bookingId, status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBookings(updatedBookings.data.bookings);
        showToast(actionMessage, "success");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      showToast(
        error.response?.data?.message || "Failed to update booking",
        "error",
      );
    }
  };

  const startService = async (bookingId) => {
    try {
      const token = localStorage.getItem("providerToken");
      const response = await axios.put(
        "http://localhost:5050/api/bookings/start",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBookings(updatedBookings.data.bookings);
        showToast("Service Started! ⏱️", "success");
      }
    } catch (error) {
      console.error("Error starting service:", error);
      showToast(
        error.response?.data?.message || "Failed to start service",
        "error",
      );
    }
  };

  const completeService = async (bookingId) => {
    try {
      const token = localStorage.getItem("providerToken");
      const response = await axios.put(
        "http://localhost:5050/api/bookings/complete",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBookings(updatedBookings.data.bookings);
        showToast("Service Completed! 🎉", "success");
      }
    } catch (error) {
      console.error("Error completing service:", error);
      showToast(
        error.response?.data?.message || "Failed to complete service",
        "error",
      );
    }
  };

  const handleAccept = (bookingId) =>
    updateBookingStatus(
      bookingId,
      "confirmed",
      "Booking Accepted Successfully! ✅",
    );
  const handleReject = (bookingId) =>
    updateBookingStatus(bookingId, "rejected", "Booking Rejected ❌");

  const handleUserClick = (userData, bookingDetails) => {
    setSelectedUser({ ...userData, bookingDetails });
    setShowUserModal(true);
  };

  const getUserImage = (name, email, avatar) => {
    if (avatar) return avatar;
    const displayName = name || email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName,
    )}&background=3b82f6&color=fff&size=100&bold=true`;
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
    return `$${amount}`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  // Calculate statistics
  const totalBookings =
    bookings.pending.length +
    bookings.confirmed.length +
    bookings.in_progress.length +
    bookings.completed.length +
    bookings.rejected.length +
    bookings.cancelled.length;
  const pendingCount = bookings.pending.length;
  const completedCount = bookings.completed.length;
  const rejectedCount = bookings.rejected.length;
  const cancelledCount = bookings.cancelled.length;
  const inProgressCount = bookings.in_progress.length;

  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: Briefcase,
      color: "blue",
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      icon: Clock,
      color: "orange",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Play,
      color: "purple",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Total Rating",
      value: provider.rating.toFixed(1),
      icon: Star,
      color: "yellow",
      suffix: "⭐",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("provider");
    localStorage.removeItem("providerToken");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  // Get visible bookings based on expanded state
  const getVisibleBookings = (bookingsList, isExpanded, itemsToShow = 4) => {
    if (isExpanded) return bookingsList;
    return bookingsList.slice(0, itemsToShow);
  };

  // Check if section has more than 4 items
  const hasMoreThanFour = (bookingsList) => bookingsList.length > 4;

  const renderBookingSection = (
    title,
    bookingsList,
    type,
    onStart,
    onComplete,
  ) => {
    const isExpanded = expandedSections[type];
    const visibleBookings = getVisibleBookings(bookingsList, isExpanded);
    const showViewAll = hasMoreThanFour(bookingsList);
    const isEmpty = bookingsList.length === 0;

    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {showViewAll && (
            <button
              onClick={() => toggleSection(type)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-all duration-300 hover:translate-x-1"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View All ({bookingsList.length}){" "}
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
            <h3 className="text-md font-medium text-gray-700 mb-1">
              No {title.toLowerCase()}
            </h3>
            <p className="text-sm text-gray-500">
              {type === "pending" &&
                "When customers book your services, they will appear here."}
              {type === "confirmed" &&
                "Accepted bookings waiting to be started will appear here."}
              {type === "in_progress" &&
                "Services that have been started will appear here."}
              {type === "history" &&
                "Completed, rejected, or cancelled bookings will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                type={type}
                onAccept={() => handleAccept(booking._id)}
                onReject={() => handleReject(booking._id)}
                onStart={() => onStart?.(booking._id)}
                onComplete={() => onComplete?.(booking._id)}
                onUserClick={() => handleUserClick(booking.user, booking)}
                getUserImage={getUserImage}
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                renderStars={renderStars}
                statusLabels={statusLabels}
                statusColors={statusColors}
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
              <div className={`fixed top-5 right-5 z-50 animate-slide-in`}>
                <div
                  className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
                    toast.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {toast.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        toast.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {toast.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const colors = {
                  blue: "from-blue-500 to-blue-400",
                  orange: "from-orange-500 to-orange-400",
                  purple: "from-purple-500 to-purple-400",
                  green: "from-green-500 to-green-400",
                  yellow: "from-yellow-500 to-yellow-400",
                  red: "from-red-500 to-red-400",
                };
                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center shadow-lg mb-4`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <h2 className="text-2xl font-bold text-gray-800 mt-1">
                      {stat.value}{" "}
                      {stat.suffix && (
                        <span className="text-sm font-normal">
                          {stat.suffix}
                        </span>
                      )}
                    </h2>
                    {stat.label === "Total Rating" && (
                      <div className="mt-2">{renderStars(provider.rating)}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent Booking Requests Section */}
            {renderBookingSection(
              "Recent Booking Requests",
              bookings.pending,
              "pending",
            )}

            {/* Accepted Bookings Section */}
            {renderBookingSection(
              "Accepted Bookings (Ready to Start)",
              bookings.confirmed,
              "confirmed",
              startService,
            )}

            {/* In-Progress Bookings Section */}
            {renderBookingSection(
              "Services In Progress",
              bookings.in_progress,
              "in_progress",
              null,
              completeService,
            )}

            {/* Recent Booking History Section */}
            {renderBookingSection(
              "Recent Booking History",
              [
                ...bookings.completed,
                ...bookings.rejected,
                ...bookings.cancelled,
              ],
              "history",
            )}
          </>
        );

      case "earnings":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Earnings Overview
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$4,250</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$1,280</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">Average per Job</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$145</p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {bookings.completed.length} completed jobs
                </p>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Profile Settings
            </h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={provider.avatar}
                    className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover"
                    alt={provider.fullName}
                  />
                  <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full shadow-lg hover:bg-blue-700 transition">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{provider.fullName}</h3>
                  <p className="text-gray-500">{provider.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(provider.rating)}
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField label="First Name" value={provider.firstName} />
                <ProfileField label="Last Name" value={provider.lastName} />
                <ProfileField label="Email" value={provider.email} />
                <ProfileField label="Phone" value={provider.phone} />
                <ProfileField
                  label="Service Category"
                  value={provider.category}
                />
                <ProfileField label="Experience" value={provider.experience} />
                <ProfileField
                  label="Hourly Rate"
                  value={`$${provider.hourlyRate}/hr`}
                />
                <ProfileField
                  label="Service Area"
                  value={provider.serviceArea}
                />
                <ProfileField
                  label="Address"
                  value={`${provider.address}, ${provider.city}`}
                />
                <ProfileField
                  label="Available Days"
                  value={provider.availableDays?.join(", ")}
                />
              </div>
              {provider.serviceTags?.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Service Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.serviceTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {provider.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">About Me</p>
                  <p className="text-gray-700 mt-1">{provider.description}</p>
                </div>
              )}
            </div>
          </div>
        );

      case "support":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Help & Support
            </h2>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Frequently Asked Questions
                </h3>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How do I manage my
                    bookings?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How do I update my
                    availability?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How are payments
                    processed?
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">
                  Contact Support
                </h3>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* User Profile Modal */}
      {showUserModal && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          getUserImage={getUserImage}
          formatDate={formatDate}
          formatTime={formatTime}
          formatPrice={formatPrice}
          renderStars={renderStars}
          statusLabels={statusLabels}
          statusColors={statusColors}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur-sm flex-col p-6 fixed left-0 top-0 h-screen border-r border-gray-200 shadow-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            ServEase
          </h2>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6 border border-blue-100">
          <img
            src={provider.avatar}
            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
            alt={provider.fullName}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {provider.fullName}
            </p>
            <p className="text-xs text-blue-600 font-medium">{provider.role}</p>
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
                <Icon
                  className={`w-5 h-5 ${
                    activeTab === item.id
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </aside>

      <main className="flex-1 ml-0 md:ml-72 overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {provider.firstName || "Provider"}! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Here's what's happening with your business today.
              </p>
            </div>
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <div className="p-8">{renderContent()}</div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Booking Card Component
const BookingCard = ({
  booking,
  type,
  onAccept,
  onReject,
  onStart,
  onComplete,
  onUserClick,
  getUserImage,
  formatDate,
  formatTime,
  formatPrice,
  renderStars,
  statusLabels,
  statusColors,
}) => {
  const statusColor = statusColors[booking.status] || statusColors.pending;
  const statusLabel = statusLabels[booking.status] || booking.status;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onUserClick}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 hover:scale-105 transition cursor-pointer"
            >
              <img
                src={getUserImage(
                  booking.user.name,
                  booking.user.email,
                  booking.user.avatar,
                )}
                className="w-full h-full object-cover"
                alt={booking.user.name}
              />
            </button>
            <div>
              <button
                onClick={onUserClick}
                className="font-semibold text-gray-800 hover:text-blue-600 transition text-left"
              >
                {booking.user.name}
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{booking.user.phone}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1 ml-15">
            <p className="text-sm text-blue-600 font-medium">
              {booking.service}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{booking.user.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(booking.date)}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{booking.time}</span>
            </div>
            {/* Show timing information for in-progress and completed bookings */}
            {(booking.status === "in_progress" ||
              booking.status === "completed") && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                {booking.startTime && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Started:</span>{" "}
                    {formatTime(booking.startTime)}
                  </p>
                )}
                {booking.endTime && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Completed:</span>{" "}
                    {formatTime(booking.endTime)}
                  </p>
                )}
                {booking.duration > 0 && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Actual Duration:</span>{" "}
                    {booking.duration.toFixed(2)} hours
                  </p>
                )}
                {booking.hoursCharged > 0 && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Hours Billed:</span>{" "}
                    {booking.hoursCharged} hour(s)
                    <span className="text-gray-400 ml-1">
                      (billed in full hour increments)
                    </span>
                  </p>
                )}
                {booking.calculatedAmount > 0 && (
                  <p className="text-xs font-semibold text-green-600">
                    <span className="font-medium">Total:</span>{" "}
                    {formatPrice(booking.calculatedAmount)}
                    <span className="text-gray-400 text-xs font-normal ml-1">
                      (@ ${booking.provider?.hourlyRate}/hour ×{" "}
                      {booking.hoursCharged} hours)
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-right min-w-[180px]">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}
          >
            <CheckCircle className="w-3 h-3" />
            {statusLabel}
          </span>
          <p className="text-sm font-semibold text-gray-700 mt-2">
            {booking.calculatedAmount > 0
              ? formatPrice(booking.calculatedAmount)
              : formatPrice(booking.totalAmount)}
          </p>

          {type === "pending" && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onReject}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
              >
                Reject
              </button>
              <button
                onClick={onAccept}
                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition"
              >
                Accept
              </button>
            </div>
          )}

          {type === "confirmed" && (
            <button
              onClick={onStart}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1 mx-auto"
            >
              <Play className="w-4 h-4" />
              Start Service
            </button>
          )}

          {type === "in_progress" && (
            <button
              onClick={onComplete}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1 mx-auto"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Service
            </button>
          )}

          {type === "history" &&
            booking.status === "completed" &&
            booking.rating && (
              <div className="mt-2">
                {renderStars && renderStars(booking.rating)}
                {booking.review && (
                  <div className="text-left mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 italic">
                      "{booking.review}"
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Profile Field Component
const ProfileField = ({ label, value }) => (
  <div className="p-4 bg-gray-50 rounded-xl">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "Not specified"}</p>
  </div>
);

// User Modal Component
const UserModal = ({
  user,
  onClose,
  getUserImage,
  formatDate,
  formatTime,
  formatPrice,
  renderStars,
  statusLabels,
  statusColors,
}) => {
  const statusColor =
    statusColors[user.bookingDetails?.status] || statusColors.pending;
  const statusLabel =
    statusLabels[user.bookingDetails?.status] || user.bookingDetails?.status;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">User Details</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={getUserImage(user.name, user.email, user.avatar)}
              className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover"
              alt={user.name}
            />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">
                {user.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Phone className="w-4 h-4" />
                <span>{user.phone}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Booking Details
            </h5>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Service:</span>{" "}
                {user.bookingDetails?.service}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Address:</span>{" "}
                {user.bookingDetails?.user?.address}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Date & Time:</span>{" "}
                {formatDate(user.bookingDetails?.date)} at{" "}
                {user.bookingDetails?.time}
              </p>
              {user.bookingDetails?.startTime && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Started:</span>{" "}
                  {formatTime(user.bookingDetails?.startTime)}
                </p>
              )}
              {user.bookingDetails?.endTime && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Completed:</span>{" "}
                  {formatTime(user.bookingDetails?.endTime)}
                </p>
              )}
              {user.bookingDetails?.duration > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Duration:</span>{" "}
                  {user.bookingDetails?.duration} hour(s)
                </p>
              )}
              {user.bookingDetails?.calculatedAmount > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Total Amount:
                  </span>{" "}
                  {formatPrice(user.bookingDetails?.calculatedAmount)}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Description:</span>{" "}
                {user.bookingDetails?.instructions ||
                  "No additional instructions"}
              </p>
            </div>
          </div>

          {user.bookingDetails?.status === "completed" &&
            user.bookingDetails?.rating && (
              <div className="border-t border-gray-100 mt-4 pt-4">
                <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Customer Review
                </h5>
                <div className="mb-2">
                  {renderStars(user.bookingDetails.rating)}
                </div>
                <p className="text-sm text-gray-600 italic">
                  "{user.bookingDetails.review}"
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
