import { useState, useEffect, useRef } from "react";
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
  Menu,
  Play,
} from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import UserChat from "./UserChat";
import PaymentButton from "../components/PaymentButton";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "https://i.pravatar.cc/100?u=default",
  });
  const [bookings, setBookings] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(true);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

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

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      const storedNotifications = localStorage.getItem("user_notifications");
      if (storedNotifications) {
        try {
          const parsed = JSON.parse(storedNotifications);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n) => !n.read).length);
        } catch (e) {
          console.error("Error loading notifications:", e);
        }
      }
    };

    loadNotificationsFromStorage();
  }, []);

  // Save notifications to localStorage
  const saveNotificationsToStorage = (updatedNotifications) => {
    localStorage.setItem(
      "user_notifications",
      JSON.stringify(updatedNotifications),
    );
  };

  // Generate unique notification ID
  const generateNotificationId = (bookingId, type) => {
    return `${bookingId}_${type}`;
  };

  // Check if notification already exists
  const notificationExists = (notificationsList, bookingId, type) => {
    return notificationsList.some(
      (n) => n.id === generateNotificationId(bookingId, type),
    );
  };

  // Create notification for booking
  const createNotification = (booking, type, title, message, time) => {
    const notificationId = generateNotificationId(booking._id, type);

    // Don't add if already exists
    if (notificationExists(notifications, booking._id, type)) {
      return null;
    }

    return {
      id: notificationId,
      type: type,
      title: title,
      message: message,
      time: new Date(time),
      read: false,
      bookingId: booking._id,
      providerName: booking.provider.name,
      bookingStatus: booking.status,
    };
  };

  // Add notification to list
  const addNotification = (newNotification) => {
    if (!newNotification) return;

    setNotifications((prev) => {
      // Check again in case of race condition
      if (
        notificationExists(
          prev,
          newNotification.bookingId,
          newNotification.type,
        )
      ) {
        return prev;
      }
      const updated = [newNotification, ...prev];
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount((prev) => prev + 1);
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
          _id: userData._id,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    };

    loadUserData();
  }, [navigate]);

  // Fetch user bookings and create notifications
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5050/api/bookings/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          const bookingsData = response.data.bookings;
          setBookings(bookingsData);

          // Load existing notifications from storage
          const existingNotifications = JSON.parse(
            localStorage.getItem("user_notifications") || "[]",
          );
          const existingIds = new Set(existingNotifications.map((n) => n.id));

          // Create notifications from bookings (only for status changes)
          const newNotifications = [];

          bookingsData.forEach((booking) => {
            // Notification for booking acceptance (confirmed)
            if (booking.status === "confirmed") {
              const notificationId = generateNotificationId(
                booking._id,
                "booking_confirmed",
              );
              if (!existingIds.has(notificationId)) {
                newNotifications.push({
                  id: notificationId,
                  type: "booking_confirmed",
                  title: "Booking Accepted! ✅",
                  message: `Your booking with ${booking.provider.name} has been accepted. They will start service on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.`,
                  time: new Date(booking.updatedAt || booking.createdAt),
                  read: false,
                  bookingId: booking._id,
                  providerName: booking.provider.name,
                });
              }
            }

            // Notification for service started
            if (booking.status === "in_progress" && booking.startTime) {
              const notificationId = generateNotificationId(
                booking._id,
                "service_started",
              );
              if (!existingIds.has(notificationId)) {
                newNotifications.push({
                  id: notificationId,
                  type: "service_started",
                  title: "Service Started! 🔧",
                  message: `${booking.provider.name} has started working on your ${booking.service} service.`,
                  time: new Date(booking.startTime),
                  read: false,
                  bookingId: booking._id,
                  providerName: booking.provider.name,
                });
              }
            }

            // Notification for service completed
            if (booking.status === "completed" && booking.endTime) {
              const notificationId = generateNotificationId(
                booking._id,
                "service_completed",
              );
              if (!existingIds.has(notificationId)) {
                newNotifications.push({
                  id: notificationId,
                  type: "service_completed",
                  title: "Service Completed! 🎉",
                  message: `${booking.provider.name} has completed your ${booking.service} service. Please leave a review!`,
                  time: new Date(booking.endTime),
                  read: false,
                  bookingId: booking._id,
                  providerName: booking.provider.name,
                });
              }
            }

            // Notification for booking rejection
            if (booking.status === "rejected") {
              const notificationId = generateNotificationId(
                booking._id,
                "booking_rejected",
              );
              if (!existingIds.has(notificationId)) {
                newNotifications.push({
                  id: notificationId,
                  type: "booking_rejected",
                  title: "Booking Rejected ❌",
                  message: `Sorry, ${booking.provider.name} could not accept your booking request. Please try booking another provider.`,
                  time: new Date(booking.updatedAt || booking.createdAt),
                  read: false,
                  bookingId: booking._id,
                  providerName: booking.provider.name,
                });
              }
            }
          });

          // Add all new notifications
          if (newNotifications.length > 0) {
            newNotifications.sort(
              (a, b) => new Date(b.time) - new Date(a.time),
            );
            setNotifications((prev) => {
              const updated = [...newNotifications, ...prev];
              saveNotificationsToStorage(updated);
              return updated;
            });
            setUnreadCount(
              (prev) => prev + newNotifications.filter((n) => !n.read).length,
            );
          } else {
            // If no new notifications, load existing ones
            setNotifications(existingNotifications);
            setUnreadCount(existingNotifications.filter((n) => !n.read).length);
          }
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

  // Add this useEffect in UserDashboard.jsx (after fetchBookings)
  useEffect(() => {
    const cleanupDuplicateChats = async () => {
      const token = localStorage.getItem("token");
      // Get all unique provider IDs from bookings
      const uniqueProviderIds = new Set();
      bookings.forEach((booking) => {
        if (booking.provider?.providerId) {
          uniqueProviderIds.add(booking.provider.providerId);
        }
      });

      // Clean up duplicates for each provider
      for (const providerId of uniqueProviderIds) {
        try {
          await axios.post(
            "http://localhost:5050/api/chat/cleanup-duplicates",
            { providerId },
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } catch (error) {
          console.error("Cleanup error for provider:", providerId, error);
        }
      }
    };

    if (bookings.length > 0) {
      cleanupDuplicateChats();
    }
  }, [bookings]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      );
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((notif) => ({ ...notif, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(0);
    showToast("All notifications marked as read", "success");
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);

    // Navigate to relevant section or show provider details
    if (notification.bookingId) {
      const booking = bookings.find((b) => b._id === notification.bookingId);
      if (booking && notification.type === "service_completed") {
        handleReviewClick(booking);
      } else if (booking) {
        handleProviderClick(booking.provider, booking);
      }
    }
  };

  // Format time for notifications
  const formatNotificationTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Get notification icon and color based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case "booking_confirmed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case "service_started":
        return { icon: Play, color: "text-blue-600", bgColor: "bg-blue-100" };
      case "service_completed":
        return {
          icon: CheckCircle,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        };
      case "booking_rejected":
        return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" };
      default:
        return { icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };

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
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5050/api/bookings/cancel",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/user",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBookings(updatedBookings.data.bookings);
        showToast("Booking cancelled successfully", "success");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showToast(
        error.response?.data?.message || "Failed to cancel booking",
        "error",
      );
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const updatedBookings = await axios.get(
          "http://localhost:5050/api/bookings/user",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBookings(updatedBookings.data.bookings);
        setShowReviewModal(false);
        showToast(
          "Review submitted successfully! Thank you for your feedback.",
          "success",
        );
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast(
        error.response?.data?.message || "Failed to submit review",
        "error",
      );
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
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
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
    (b) => b.status === "pending" || b.status === "confirmed",
  );

  const historyBookingsList = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "rejected" ||
      b.status === "cancelled",
  );

  // Statistics
  const totalBookings = bookings.length;
  const upcomingCount = upcomingBookingsList.length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: CalendarPlus,
      color: "blue",
    },
    {
      label: "Upcoming Bookings",
      value: upcomingCount,
      icon: Clock,
      color: "yellow",
    },
    {
      label: "Completed Bookings",
      value: completedCount,
      icon: CheckCircle,
      color: "green",
    },
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
    { id: "messages", label: "Messages", icon: MessageSquare },
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
    const visibleBookings = getVisibleBookings(
      upcomingBookingsList,
      isExpanded,
    );
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
            <h3 className="text-md font-medium text-gray-700 mb-1">
              No upcoming bookings
            </h3>
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
                onProviderClick={() =>
                  handleProviderClick(booking.provider, booking)
                }
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

    // Handle payment completion - refresh bookings
    const handlePaymentComplete = async (payment) => {
      showToast(
        `Payment of Rs. ${payment.amount} completed successfully!`,
        "success",
      );

      // Refresh bookings to update payment status
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5050/api/bookings/user",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (error) {
        console.error("Error refreshing bookings:", error);
      }
    };

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
            <h3 className="text-md font-medium text-gray-700 mb-1">
              No booking history
            </h3>
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
                onProviderClick={() =>
                  handleProviderClick(booking.provider, booking)
                }
                getProviderImage={getProviderImage}
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                renderStars={renderStars}
                onPaymentComplete={handlePaymentComplete}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatProvider, setSelectedChatProvider] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Fetch user chats
  const fetchUserChats = async () => {
    try {
      setLoadingChats(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5050/api/chat/user/chats",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setUserChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchUserChats();
    }
  }, [activeTab]);

  // Open chat with provider
  const openChat = (chat) => {
    const booking = bookings.find((b) => b._id === chat.bookingId);
    if (booking) {
      setSelectedChatBooking(booking);
      setSelectedChatProvider({
        _id: chat.participants.provider.providerId,
        name: chat.participants.provider.name,
        avatar: chat.participants.provider.avatar,
        category: booking.provider?.category || "Service Provider",
      });
      setShowChat(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Toast Notification */}
            {toast.show && (
              <div className="fixed top-5 right-5 z-50 animate-slide-in">
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
                  <p
                    className={`text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}
                  >
                    {toast.message}
                  </p>
                </div>
              </div>
            )}

            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const colors = {
                  blue: "from-blue-500 to-blue-400",
                  yellow: "from-yellow-500 to-yellow-400",
                  green: "from-green-500 to-green-400",
                };
                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100"
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center shadow-lg mb-3 md:mb-4`}
                    >
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <p className="text-xs md:text-sm text-gray-500">
                      {stat.label}
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                      {stat.value}
                    </h2>
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

      case "messages":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-[calc(100vh-200px)]">
            {showChat ? (
              <UserChat
                booking={
                  selectedChat?.bookingId ? { _id: selectedChat.bookingId } : {}
                }
                provider={{
                  _id: selectedChat?.participants?.provider?.providerId,
                  name: selectedChat?.participants?.provider?.name,
                  avatar: selectedChat?.participants?.provider?.avatar,
                  category:
                    selectedChatProvider?.category || "Service Provider",
                }}
                onClose={() => setShowChat(false)}
              />
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Messages
                </h2>
                {loadingChats ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userChats.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      When you message providers, conversations will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userChats.map((chat) => {
                      // Find the booking associated with this chat
                      const booking = bookings.find(
                        (b) => b._id === chat.bookingId,
                      );
                      return (
                        <div
                          key={chat._id}
                          onClick={() => {
                            setSelectedChat(chat);
                            setSelectedChatProvider({
                              _id: chat.participants.provider.providerId,
                              name: chat.participants.provider.name,
                              avatar: chat.participants.provider.avatar,
                              category:
                                booking?.provider?.category ||
                                "Service Provider",
                            });
                            setShowChat(true);
                          }}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer border border-gray-100"
                        >
                          <img
                            src={
                              chat.participants.provider.avatar ||
                              `https://ui-avatars.com/api/?name=${chat.participants.provider.name}&background=3b82f6&color=fff&size=80`
                            }
                            className="w-12 h-12 rounded-full object-cover"
                            alt={chat.participants.provider.name}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {chat.participants.provider.name}
                              </h3>
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  chat.lastMessageTime,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "profile":
        return <ProfileSettings onProfileUpdate={handleProfileUpdate} />;

      case "support":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
              Help & Support
            </h2>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Frequently Asked Questions
                </h3>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                    • How do I book a service?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                    • What is your cancellation policy?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                    • How are service providers verified?
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

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur-sm flex-col p-6 fixed left-0 top-0 h-screen border-r border-gray-200 shadow-lg overflow-y-auto">
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
            src={user.avatar}
            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
            alt={user.name}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-blue-600 font-medium truncate">
              {user.email}
            </p>
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
                  className={`w-5 h-5 ${activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
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

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-72 bg-white h-full z-40 shadow-xl md:hidden overflow-y-auto">
            <div className="flex flex-col h-full p-6">
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
                  src={user.avatar}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                  alt={user.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-blue-600 font-medium truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <nav className="space-y-1 flex-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="md:ml-72 min-h-screen">
        {/* Header with Notification */}
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
          <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {activeTab === "profile"
                  ? "Profile Settings"
                  : `Welcome back, ${user.name.split(" ")[0]}! 👋`}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {activeTab === "profile"
                  ? "Manage your personal details"
                  : "Here's what's happening with your bookings"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNewBookingClick}
                className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md text-sm md:text-base"
              >
                <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">New Booking</span>
              </button>

              {/* Notification Icon with Panel */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-105"
                >
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-800">
                          Notifications
                        </h3>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">No notifications</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Updates about your bookings will appear here
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const {
                            icon: Icon,
                            color,
                            bgColor,
                          } = getNotificationStyle(notification.type);
                          return (
                            <div
                              key={notification.id}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                !notification.read ? "bg-blue-50/30" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
                                >
                                  <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatNotificationTime(notification.time)}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">{renderContent()}</div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

// Booking Card Component (updated with responsive design)
// Booking Card Component (updated with payment button)
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
  onPaymentComplete, // Add this prop
}) => {
  const statusColor = getStatusColor(booking.status);
  const statusLabel = getStatusLabel(booking.status);
  const canCancel = booking.status === "pending";
  const canReview =
    booking.status === "completed" &&
    (!booking.rating || booking.rating === null);
  const hasReviewed = booking.rating && booking.rating !== null;
  const needsPayment =
    booking.status === "completed" && !booking.paymentCompleted;

  return (
    <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onProviderClick}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-blue-100 hover:scale-105 transition cursor-pointer"
            >
              <img
                src={getProviderImage(booking.provider)}
                className="w-full h-full object-cover"
                alt={booking.provider.name}
              />
            </button>
            <div>
              <button
                onClick={onProviderClick}
                className="font-semibold text-gray-800 hover:text-blue-600 transition text-left text-sm md:text-base"
              >
                {booking.provider.name}
              </button>
              <p className="text-xs text-blue-600">{booking.service}</p>
            </div>
          </div>

          <div className="space-y-1 ml-12 md:ml-15">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(booking.date)}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{booking.time}</span>
            </div>
            {booking.startTime && (
              <p className="text-xs text-gray-500">
                Started: {formatTime(booking.startTime)}
              </p>
            )}
            {booking.endTime && (
              <p className="text-xs text-gray-500">
                Completed: {formatTime(booking.endTime)}
              </p>
            )}
            {booking.duration > 0 && (
              <p className="text-xs text-gray-500">
                Duration: {booking.duration.toFixed(2)} hours
              </p>
            )}
          </div>
        </div>

        <div className="text-right min-w-[140px] md:min-w-[160px]">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 text-xs font-medium rounded-full ${statusColor}`}
          >
            <CheckCircle className="w-3 h-3" />
            {statusLabel}
          </span>
          <p className="text-base md:text-lg font-bold text-gray-800 mt-2">
            {booking.calculatedAmount > 0
              ? formatPrice(booking.calculatedAmount)
              : formatPrice(booking.totalAmount)}
          </p>

          {type === "upcoming" && canCancel && (
            <button
              onClick={onCancel}
              className="mt-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-50 text-red-600 rounded-lg text-xs md:text-sm font-medium hover:bg-red-100 transition flex items-center gap-1 mx-auto"
            >
              <XCircle className="w-3 h-3 md:w-4 md:h-4" />
              Cancel
            </button>
          )}

          {/* Payment Button - Show for completed bookings that need payment */}
          {type === "history" && needsPayment && (
            <div className="mt-3 pt-2">
              <PaymentButton
                booking={booking}
                onPaymentComplete={onPaymentComplete}
              />
            </div>
          )}

          {type === "history" && canReview && (
            <button
              onClick={onReview}
              className="mt-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-50 text-green-600 rounded-lg text-xs md:text-sm font-medium hover:bg-green-100 transition flex items-center gap-1 mx-auto"
            >
              <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" />
              Review
            </button>
          )}

          {type === "history" && hasReviewed && (
            <div className="mt-2">
              {renderStars(booking.rating)}
              {booking.review && (
                <div className="text-left mt-1 p-2 bg-gray-50 rounded-lg">
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

// Provider Modal Component
const ProviderModal = ({
  provider,
  booking,
  onClose,
  getProviderImage,
  formatDate,
  formatTime,
  formatPrice,
  renderStars,
  getStatusLabel,
  getStatusColor,
}) => {
  const statusColor = getStatusColor(booking.status);
  const statusLabel = getStatusLabel(booking.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">Provider Details</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={getProviderImage(provider)}
              className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover"
              alt={provider.name}
            />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">
                {provider.name}
              </h4>
              <p className="text-sm text-blue-600">{provider.category}</p>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(provider.rating || 0)}
                <span className="text-xs text-gray-500 ml-1">
                  ({provider.totalReviews || 0} reviews)
                </span>
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
                {booking.service}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Date & Time:</span>{" "}
                {formatDate(booking.date)} at {booking.time}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </p>
              {booking.startTime && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Started:</span>{" "}
                  {formatTime(booking.startTime)}
                </p>
              )}
              {booking.endTime && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Completed:</span>{" "}
                  {formatTime(booking.endTime)}
                </p>
              )}
              {booking.duration > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Duration:</span>{" "}
                  {booking.duration.toFixed(2)} hours
                </p>
              )}
              {booking.calculatedAmount > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Total Amount:
                  </span>{" "}
                  {formatPrice(booking.calculatedAmount)}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              About Provider
            </h5>
            <p className="text-sm text-gray-600">
              {provider.description ||
                "Professional service provider dedicated to quality work and customer satisfaction."}
            </p>
            {provider.experience && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Experience:</span>{" "}
                {provider.experience}
              </p>
            )}
            {provider.hourlyRate && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Hourly Rate:</span> Rs.{" "}
                {provider.hourlyRate}/hr
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({
  booking,
  ratingValue,
  setRatingValue,
  reviewText,
  setReviewText,
  onSubmit,
  onClose,
  renderStars,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">Rate Your Experience</h3>
              <p className="text-sm text-blue-100 mt-1">How was the service?</p>
            </div>
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">
                {booking.provider.name}
              </h4>
              <p className="text-sm text-gray-500">{booking.service}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= ratingValue
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
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
