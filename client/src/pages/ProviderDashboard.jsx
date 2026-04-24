import { useState, useEffect, useRef } from "react";
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
  Award,
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
  Hourglass,
  Shield,
  Menu,
} from "lucide-react";
import ProviderChat from "./ProviderChat";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

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

  // Navigation items
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "profile", label: "Profile", icon: User },
    { id: "support", label: "Help & Support", icon: HelpCircle },
  ];

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
      const storedNotifications = localStorage.getItem(
        "provider_notifications",
      );
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
      "provider_notifications",
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

  // Create notification for booking (only for new bookings and cancellations)
  const createNotification = (booking, type, title, message) => {
    // Only allow new_booking and booking_cancelled types
    if (type !== "new_booking" && type !== "booking_cancelled") {
      return null;
    }

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
      time: new Date(),
      read: false,
      bookingId: booking._id,
      user: booking.user,
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

  const handleLogout = () => {
    localStorage.removeItem("provider");
    localStorage.removeItem("providerToken");
    localStorage.removeItem("userType");
    navigate("/login");
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
          isVerified: providerData.isVerified || false,
        });
      } catch (error) {
        console.error("Error parsing provider data:", error);
        navigate("/login");
      }
    };

    loadProviderData();
  }, [navigate]);

  // Fetch provider bookings and create notifications (only for new bookings and cancellations)
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
          const bookingsData = response.data.bookings;
          setBookings(bookingsData);

          // Create notifications for pending bookings (new booking requests)
          const newNotifications = [];

          bookingsData.pending.forEach((booking) => {
            // Check if notification already exists in localStorage
            const existingNotifications = JSON.parse(
              localStorage.getItem("provider_notifications") || "[]",
            );
            const alreadyExists = existingNotifications.some(
              (n) =>
                n.id === generateNotificationId(booking._id, "new_booking"),
            );

            if (!alreadyExists) {
              const notification = createNotification(
                booking,
                "new_booking",
                "New Booking Request",
                `${booking.user.name} requested a ${booking.service} service`,
              );
              if (notification) newNotifications.push(notification);
            }
          });

          // Create notifications for cancelled bookings (from user cancellation)
          bookingsData.cancelled.forEach((booking) => {
            // Check if notification already exists
            const existingNotifications = JSON.parse(
              localStorage.getItem("provider_notifications") || "[]",
            );
            const alreadyExists = existingNotifications.some(
              (n) =>
                n.id ===
                generateNotificationId(booking._id, "booking_cancelled"),
            );

            if (!alreadyExists) {
              const notification = createNotification(
                booking,
                "booking_cancelled",
                "Booking Cancelled",
                `${booking.user.name} cancelled their ${booking.service} booking`,
              );
              if (notification) newNotifications.push(notification);
            }
          });

          // Add all new notifications
          if (newNotifications.length > 0) {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const uniqueNew = newNotifications.filter(
                (n) => !existingIds.has(n.id),
              );
              const updated = [...uniqueNew, ...prev];
              saveNotificationsToStorage(updated);
              return updated;
            });
            setUnreadCount(
              (prev) => prev + newNotifications.filter((n) => !n.read).length,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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

    // Scroll to the pending section for new bookings
    if (notification.type === "new_booking") {
      const pendingSection = document.getElementById("pending-bookings");
      if (pendingSection) {
        pendingSection.scrollIntoView({ behavior: "smooth" });
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

  // Update booking status - NO notifications created for accept/reject
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

        // DO NOT create notifications for accept/reject actions
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

  const handleAccept = (bookingId) =>
    updateBookingStatus(
      bookingId,
      "confirmed",
      "Booking Accepted Successfully! ✅",
    );

  const handleReject = (bookingId) =>
    updateBookingStatus(bookingId, "rejected", "Booking Rejected ❌");

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
        // DO NOT create notification for service start
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
        // DO NOT create notification for service completion
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
    return `Rs. ${amount}`;
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

  const getVisibleBookings = (bookingsList, isExpanded, itemsToShow = 4) => {
    if (isExpanded) return bookingsList;
    return bookingsList.slice(0, itemsToShow);
  };

  const hasMoreThanFour = (bookingsList) => bookingsList.length > 4;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
      <section
        className="mb-10"
        id={type === "pending" ? "pending-bookings" : undefined}
      >
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

  // Chat List Component for ProviderDashboard
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [providerChats, setProviderChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Fetch provider chats
  const fetchProviderChats = async () => {
    try {
      setLoadingChats(true);
      const token = localStorage.getItem("providerToken");
      const response = await axios.get(
        "http://localhost:5050/api/chat/provider/chats",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setProviderChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchProviderChats();
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
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const colors = {
                  blue: "from-blue-500 to-blue-400",
                  orange: "from-orange-500 to-orange-400",
                  purple: "from-purple-500 to-purple-400",
                  green: "from-green-500 to-green-400",
                  yellow: "from-yellow-500 to-yellow-400",
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

            {/* Booking Sections */}
            {renderBookingSection(
              "Recent Booking Requests",
              bookings.pending,
              "pending",
            )}
            {renderBookingSection(
              "Accepted Bookings (Ready to Start)",
              bookings.confirmed,
              "confirmed",
              startService,
            )}
            {renderBookingSection(
              "Services In Progress",
              bookings.in_progress,
              "in_progress",
              null,
              completeService,
            )}
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

      case "messages":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-[calc(100vh-200px)]">
            {showChat ? (
              <ProviderChat
                chat={selectedChat}
                user={selectedChatUser}
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
                ) : providerChats.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      When users message you, conversations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {providerChats.map((chat) => (
                      <div
                        key={chat._id}
                        onClick={() => {
                          setSelectedChat(chat);
                          setSelectedChatUser({
                            _id: chat.participants.user.userId,
                            name: chat.participants.user.name,
                            avatar: chat.participants.user.avatar,
                            email: "",
                          });
                          setShowChat(true);
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer border border-gray-100"
                      >
                        <img
                          src={
                            chat.participants.user.avatar ||
                            `https://ui-avatars.com/api/?name=${chat.participants.user.name}&background=3b82f6&color=fff&size=80`
                          }
                          className="w-12 h-12 rounded-full object-cover"
                          alt={chat.participants.user.name}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {chat.participants.user.name}
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
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "earnings":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
              Earnings Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
                  Rs. 4,250
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 md:p-6">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
                  Rs. 1,280
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 md:p-6">
                <p className="text-sm text-gray-600">Average per Job</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
                  Rs. 145
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {bookings.completed.length} completed jobs
                </p>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
              Profile Settings
            </h2>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
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
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold">{provider.fullName}</h3>
                  <p className="text-gray-500">{provider.role}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
                    {renderStars(provider.rating)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={`Rs. ${provider.hourlyRate}/hr`}
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
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
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

  if (!loading && provider && !provider.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hourglass className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pending Verification
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is awaiting admin approval. You will be notified once
            your account is verified.
          </p>
          <p className="text-sm text-gray-500">
            This process usually takes 24-48 hours. Thank you for your patience.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
                  src={provider.avatar}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                  alt={provider.fullName}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {provider.fullName}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {provider.role}
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
                Welcome back, {provider.firstName || "Provider"}! 👋
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Here's what's happening with your business today.
              </p>
            </div>

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
                          New booking requests and cancellations will appear
                          here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        let bgColor = "bg-gray-100";
                        let iconColor = "text-gray-600";
                        let IconComponent = Bell;

                        switch (notification.type) {
                          case "new_booking":
                            bgColor = "bg-green-100";
                            iconColor = "text-green-600";
                            IconComponent = Calendar;
                            break;
                          case "booking_cancelled":
                            bgColor = "bg-orange-100";
                            iconColor = "text-orange-600";
                            IconComponent = XCircle;
                            break;
                          default:
                            IconComponent = Bell;
                        }

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
                                <IconComponent
                                  className={`w-5 h-5 ${iconColor}`}
                                />
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
        </header>

        <div className="p-4 md:p-8">{renderContent()}</div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
    <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onUserClick}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-blue-100 hover:scale-105 transition cursor-pointer"
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
                <span>{booking.user.phone || "No phone"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1 ml-12 md:ml-15">
            <p className="text-sm text-blue-600 font-medium">
              {booking.service}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{booking.user.address}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(booking.date)}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{booking.time}</span>
            </div>
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
                  </p>
                )}
                {booking.calculatedAmount > 0 && (
                  <p className="text-xs font-semibold text-green-600">
                    <span className="font-medium">Total:</span>{" "}
                    {formatPrice(booking.calculatedAmount)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-right min-w-[160px]">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 text-xs font-medium rounded-full ${statusColor}`}
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
                className="px-2 py-1 md:px-3 md:py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
              >
                Reject
              </button>
              <button
                onClick={onAccept}
                className="px-2 py-1 md:px-3 md:py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition"
              >
                Accept
              </button>
            </div>
          )}

          {type === "confirmed" && (
            <button
              onClick={onStart}
              className="mt-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-green-700 transition flex items-center gap-1 mx-auto"
            >
              <Play className="w-3 h-3 md:w-4 md:h-4" />
              Start Service
            </button>
          )}

          {type === "in_progress" && (
            <button
              onClick={onComplete}
              className="mt-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1 mx-auto"
            >
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
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
  <div className="p-3 md:p-4 bg-gray-50 rounded-xl">
    <p className="text-xs md:text-sm text-gray-500">{label}</p>
    <p className="font-medium text-sm md:text-base">
      {value || "Not specified"}
    </p>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                <span className="break-all">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Phone className="w-4 h-4" />
                <span>{user.phone || "Not provided"}</span>
              </div>
              {user.emergencyContact && (
                <div className="flex items-center gap-2 text-sm text-orange-600 mt-1">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">
                    Emergency: {user.emergencyContact}
                  </span>
                </div>
              )}
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
