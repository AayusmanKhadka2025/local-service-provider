import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  Home,
  Bell,
  Star,
  MapPin,
  Briefcase,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Shield,
  Clock,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  ChevronRight as ChevronRightIcon,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Calendar,
  User,
  Award,
  MessageSquare,
  X,
  Edit2,
  DollarSign,
  Tag,
  ArrowLeft,
  AlertCircle,
  Check,
  ThumbsUp,
  Users,
  AlertTriangle,
  Play,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
} from "lucide-react";

const SOCKET_URL = "http://localhost:5050";

// Chat Component for Booking Page
const BookingChat = ({ provider, user, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("register", { userId: user._id, userType: "user" });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  // Get or create chat - NO BOOKING ID
  useEffect(() => {
    const getOrCreateChat = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5050/api/chat/get-or-create",
          {
            providerId: provider._id,
            providerName: `${provider.firstName} ${provider.lastName}`,
            providerAvatar: provider.profileImage,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.success) {
          setChat(response.data.chat);

          if (socket) {
            socket.emit("join_chat", { chatId: response.data.chat._id });
          }

          const messagesResponse = await axios.get(
            `http://localhost:5050/api/chat/messages/${response.data.chat._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (messagesResponse.data.success) {
            setMessages(messagesResponse.data.messages);
          }
        }
      } catch (error) {
        console.error("Error getting chat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && provider) {
      getOrCreateChat();
    }
  }, [user, provider, token, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.chatId === chat?._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", (data) => {
      setOtherUserTyping(data.isTyping);
    });

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing");
    };
  }, [socket, chat?._id]);

  // Send message - NO optimistic update
  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !chat?._id) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    socket.emit("send_message", {
      chatId: chat._id,
      senderId: user._id,
      senderType: "user",
      receiverId: provider._id,
      receiverType: "provider",
      message: messageContent,
      messageType: "text",
      senderName: user.name,
      providerName: `${provider.firstName} ${provider.lastName}`,
      providerAvatar: provider.profileImage,
    });

    setSending(false);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing", {
        chatId: chat?._id,
        userId: user._id,
        isTyping: true,
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("typing", {
        chatId: chat?._id,
        userId: user._id,
        isTyping: false,
      });
    }, 1000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5050/api/chat/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        socket.emit("send_message", {
          chatId: chat._id === "temp" ? null : chat._id,
          senderId: user._id,
          senderType: "user",
          receiverId: provider._id,
          receiverType: "provider",
          message: "",
          messageType: response.data.fileType,
          mediaUrl: response.data.fileUrl,
          senderName: user.name,
          providerId: provider._id,
          providerName: `${provider.firstName} ${provider.lastName}`,
          providerAvatar: provider.profileImage,
          bookingId: bookingId,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return msgDate.toLocaleDateString();
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={
              provider.profileImage ||
              `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=ffffff&color=3b82f6&size=80`
            }
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
            alt={provider.firstName}
          />
          <div>
            <h3 className="font-semibold text-white">
              {provider.firstName} {provider.lastName}
            </h3>
            <p className="text-xs text-blue-100">{provider.category}</p>
          </div>
        </div>
        <div className="text-right text-xs text-blue-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Chat with provider</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No messages yet
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Send a message to {provider.firstName} to start the conversation.
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {dateMessages.map((message) => {
                const isSender = message.senderId === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3`}
                  >
                    <div
                      className={`max-w-[70%] ${isSender ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${isSender ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}
                      >
                        {message.messageType === "text" && (
                          <p className="text-sm break-words">
                            {message.message}
                          </p>
                        )}
                        {message.messageType === "image" && (
                          <img
                            src={message.mediaUrl}
                            alt="Shared image"
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                            onClick={() =>
                              window.open(message.mediaUrl, "_blank")
                            }
                          />
                        )}
                        {message.messageType === "video" && (
                          <video
                            src={message.mediaUrl}
                            controls
                            className="max-w-full rounded-lg"
                            controlsList="nodownload"
                          />
                        )}
                        <div
                          className={`text-xs mt-1 flex items-center justify-end gap-1 ${isSender ? "text-blue-200" : "text-gray-400"}`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {isSender &&
                            (message.read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                    {!isSender && (
                      <img
                        src={
                          provider.profileImage ||
                          `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=80`
                        }
                        className="w-8 h-8 rounded-full object-cover mx-2 order-0"
                        alt={provider.firstName}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {otherUserTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
            <div className="bg-gray-100 rounded-full px-3 py-1">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-75">.</span>
                <span className="animate-bounce delay-150">.</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            disabled={uploading}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 bg-white rounded-lg shadow-lg border p-2 z-10">
              <div className="grid grid-cols-8 gap-1">
                {[
                  "😊",
                  "😂",
                  "❤️",
                  "👍",
                  "🎉",
                  "🔥",
                  "👏",
                  "🙏",
                  "😢",
                  "😡",
                  "🥳",
                  "💪",
                  "👋",
                  "✅",
                  "⭐",
                  "💯",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl hover:bg-gray-100 p-1 rounded transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceAddress, setServiceAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [dateError, setDateError] = useState("");
  const [user, setUser] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Contact Details State
  const [contactDetails, setContactDetails] = useState({
    phoneNumber: "",
    emergencyContact: "",
  });
  const [contactErrors, setContactErrors] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Chat Modal State
  const [showChatModal, setShowChatModal] = useState(false);

  const mainContentRef = useRef(null);
  const footerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Time slots
  const timeSlots = [
    { display: "09:00 AM", value: "09:00", hour24: 9, minute: 0 },
    { display: "11:30 AM", value: "11:30", hour24: 11, minute: 30 },
    { display: "02:00 PM", value: "14:00", hour24: 14, minute: 0 },
    { display: "03:30 PM", value: "15:30", hour24: 15, minute: 30 },
    { display: "05:00 PM", value: "17:00", hour24: 17, minute: 0 },
  ];

  // Initialize socket connection for notifications
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Register user with socket
  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("register", { userId: user._id, userType: "user" });
    }
  }, [socket, user]);

  // Load notifications from localStorage
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

  const saveNotificationsToStorage = (updatedNotifications) => {
    localStorage.setItem(
      "user_notifications",
      JSON.stringify(updatedNotifications),
    );
  };

  const generateNotificationId = (bookingId, type) => {
    return `${bookingId}_${type}`;
  };

  const notificationExists = (notificationsList, bookingId, type) => {
    return notificationsList.some(
      (n) => n.id === generateNotificationId(bookingId, type),
    );
  };

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

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((notif) => ({ ...notif, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
  };

  const addNotification = (newNotification) => {
    if (!newNotification) return;
    setNotifications((prev) => {
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

  useEffect(() => {
    if (!socket) return;
    socket.on("new_notification", (notification) => {
      addNotification(notification);
    });
    return () => {
      socket.off("new_notification");
    };
  }, [socket]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          let avatarUrl = userData.avatar;
          if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
            avatarUrl = `http://localhost:5050${avatarUrl}`;
          } else if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || "User")}&background=3b82f6&color=fff&size=100`;
          }
          setUser({
            ...userData,
            avatar: avatarUrl,
          });
          await fetchUserProfile(userData.email);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    };
    loadUserData();
  }, []);

  const fetchUserProfile = async (email) => {
    try {
      setLoadingProfile(true);
      const response = await axios.get(
        `http://localhost:5050/api/users/profile/${email}`,
      );
      if (response.data.success) {
        const userProfile = response.data.user;
        setContactDetails((prev) => ({
          ...prev,
          phoneNumber: userProfile.phone || "",
          emergencyContact: userProfile.emergencyContact || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (location.state?.provider) {
      setProvider(location.state.provider);
    } else {
      navigate("/service-listing");
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!provider?._id) return;
      try {
        setLoadingReviews(true);
        const response = await axios.get(
          `http://localhost:5050/api/bookings/provider/reviews/${provider._id}`,
        );
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [provider]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const firstAvailableTime = getFirstAvailableTimeSlot(selectedDate);
      if (firstAvailableTime) {
        setSelectedTime(firstAvailableTime.display);
      }
    }
  }, [selectedDate]);

  const validateContactDetails = () => {
    const errors = {};
    if (!contactDetails.phoneNumber) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{10,}$/.test(contactDetails.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactDetails((prev) => ({ ...prev, [name]: value }));
    if (contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isTimeSlotPast = (timeSlot, date) => {
    const today = new Date();
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly > todayDateOnly) return false;
    if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (timeSlot.hour24 < currentHour) return true;
      if (timeSlot.hour24 === currentHour && timeSlot.minute <= currentMinute)
        return true;
    }
    return false;
  };

  const getFirstAvailableTimeSlot = (date) => {
    for (const slot of timeSlots) {
      if (!isTimeSlotPast(slot, date)) return slot;
    }
    return null;
  };

  const hasAvailableTimeSlots = (date) => {
    return timeSlots.some((slot) => !isTimeSlotPast(slot, date));
  };

  const isManualTimePast = (timeValue, date) => {
    const today = new Date();
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly > todayDateOnly) return false;
    if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      const [hours, minutes] = timeValue.split(":");
      const timeHour = parseInt(hours);
      const timeMinute = parseInt(minutes);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (timeHour < currentHour) return true;
      if (timeHour === currentHour && timeMinute <= currentMinute) return true;
    }
    return false;
  };

  const validateDateTime = (date, time) => {
    if (isPastDate(date)) {
      setDateError("Cannot book past dates. Please select a future date.");
      return false;
    }

    const today = new Date();
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly.getTime() === todayDateOnly.getTime() && time) {
      const [timeStr, period] = time.split(" ");
      let [hours, minutes] = timeStr.split(":");
      hours = parseInt(hours);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const selectedDateTime = new Date(date);
      selectedDateTime.setHours(hours, parseInt(minutes), 0, 0);
      if (selectedDateTime < new Date()) {
        setDateError("Cannot book past times. Please select a future time.");
        return false;
      }
    }
    setDateError("");
    return true;
  };

  const isPastTime = (time, date) => {
    const today = new Date();
    const selectedDateTime = new Date(date);
    const [timeStr, period] = time.split(" ");
    let [hours, minutes] = timeStr.split(":");
    hours = parseInt(hours);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    selectedDateTime.setHours(hours, parseInt(minutes), 0, 0);
    return selectedDateTime < today;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateSelect = (date) => {
    if (isPastDate(date)) {
      setDateError("Cannot select past dates. Please choose a future date.");
      return;
    }
    if (!hasAvailableTimeSlots(date)) {
      setDateError(
        "All time slots for this date have passed. Please select a future date.",
      );
      return;
    }
    setSelectedDate(date);
    setManualDate(formatDateForInput(date));
    setShowManualInput(false);
    setDateError("");
    const firstAvailable = getFirstAvailableTimeSlot(date);
    if (firstAvailable) setSelectedTime(firstAvailable.display);
  };

  const handleManualDateChange = (e) => {
    setManualDate(e.target.value);
    const [year, month, day] = e.target.value.split("-");
    if (year && month && day) {
      const newDate = new Date(year, month - 1, day);
      if (isPastDate(newDate)) {
        setDateError("Cannot select past dates. Please choose a future date.");
      } else if (!hasAvailableTimeSlots(newDate)) {
        setDateError(
          "All time slots for this date have passed. Please select a future date.",
        );
      } else {
        setSelectedDate(newDate);
        setDateError("");
        setManualTime("");
        const firstAvailable = getFirstAvailableTimeSlot(newDate);
        if (firstAvailable) setSelectedTime(firstAvailable.display);
      }
    }
  };

  const handleManualTimeChange = (e) => {
    const newTimeValue = e.target.value;
    setManualTime(newTimeValue);
    const [hours, minutes] = newTimeValue.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${period}`;
    setSelectedTime(formattedTime);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);
    if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      if (isManualTimePast(newTimeValue, selectedDate)) {
        setDateError(
          "Cannot book past times for today. Please select a future time.",
        );
      } else {
        setDateError("");
      }
    }
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    if (!isPastDate(newDate)) {
      if (!hasAvailableTimeSlots(newDate)) {
        setDateError(
          "All time slots for this date have passed. Please select a future date.",
        );
      }
      setSelectedDate(newDate);
      setManualDate(formatDateForInput(newDate));
      setDateError("");
    } else {
      setDateError("Cannot navigate to past weeks.");
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
    setManualDate(formatDateForInput(newDate));
    setDateError("");
  };

  const handleBooking = async () => {
    if (!validateContactDetails()) {
      setDateError("Please fill in all required contact information");
      return;
    }
    if (!serviceAddress) {
      setDateError("Please enter your service address");
      return;
    }
    if (!selectedTime) {
      setDateError("Please select a time for your booking");
      return;
    }
    if (!validateDateTime(selectedDate, selectedTime)) return;

    setBookingSuccess(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5050/api/bookings/create",
        {
          providerId: provider._id,
          serviceType: provider.category,
          date: selectedDate,
          time: selectedTime,
          address: serviceAddress,
          instructions: specialInstructions,
          hourlyRate: provider.hourlyRate,
          phoneNumber: contactDetails.phoneNumber,
          emergencyContact: contactDetails.emergencyContact,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Booking error:", error);
      setDateError(
        error.response?.data?.message ||
          "Failed to create booking. Please try again.",
      );
      setBookingSuccess(false);
    }
  };

  const handleOpenChat = () => {
    setShowChatModal(true);
  };

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getProviderImage = () => {
    if (provider.profileImage && provider.profileImage !== "") {
      return provider.profileImage;
    }
    return `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=150`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className="w-4 h-4 text-gray-300" />
                <Star
                  className="w-4 h-4 fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </div>
            );
          } else {
            return <Star key={i} className="w-4 h-4 text-gray-300" />;
          }
        })}
      </div>
    );
  };

  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReviewerImage = (userEmail, userName) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        if (currentUser.email === userEmail && currentUser.avatar) {
          let avatarUrl = currentUser.avatar;
          if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
            avatarUrl = `http://localhost:5050${avatarUrl}`;
          }
          return avatarUrl;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=80&bold=true`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-4">
              Your booking request has been sent successfully!
              <br />
              The provider will confirm shortly.
            </p>
            <div className="animate-pulse">
              <p className="text-sm text-blue-600">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal - Fully Functional */}
      {showChatModal && user && provider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] overflow-hidden animate-scaleIn">
            <BookingChat
              provider={provider}
              user={user}
              bookingId={null}
              onClose={() => setShowChatModal(false)}
            />
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/service-listing")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                ServEase
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Panel */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
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
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? "bg-blue-50/30" : ""}`}
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
            <Link to="/dashboard">
              <img
                src={user?.avatar || "https://i.pravatar.cc/100?u=user"}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 cursor-pointer hover:scale-105 transition"
                alt="Profile"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN - Keep existing booking form layout */}
      <div ref={mainContentRef} className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT - Provider Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* PROFILE CARD - With Chat Button */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex gap-5">
                <img
                  src={getProviderImage()}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-md"
                  alt={provider.firstName}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {provider.firstName} {provider.lastName}
                      </h2>
                      <p className="text-blue-600 text-sm font-medium mt-1">
                        {provider.category} Specialist
                      </p>
                    </div>
                    <button
                      onClick={handleOpenChat}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {renderStars(provider.rating || 0)}
                      <span className="ml-1">{provider.rating || 0}</span>
                      <span className="text-gray-400">
                        ({provider.totalReviews || 0} reviews)
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />{" "}
                      {provider.city || "Location not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />{" "}
                      {provider.experience || "Experience not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Rs.
                      {provider.hourlyRate || 0}/hr
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> About Me
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {provider.description}
                </p>
                {provider.serviceTags && provider.serviceTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {provider.serviceTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Client
                Reviews
              </h3>
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <ThumbsUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={getReviewerImage(
                            review.userEmail,
                            review.userName,
                          )}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          alt={review.userName}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {review.userName}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {formatReviewDate(review.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            "{review.review}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GUARANTEES */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: Shield,
                    title: "Service Guarantee",
                    desc: "30-day guarantee on all work",
                  },
                  {
                    icon: Clock,
                    title: "Punctuality",
                    desc: "Always on-time arrival",
                  },
                  {
                    icon: CheckCircle,
                    title: "Clean Workspace",
                    desc: "Leaves no mess behind",
                  },
                  {
                    icon: Award,
                    title: "Licensed & Insured",
                    desc: "Fully certified professional",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT - Booking Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Service Rate</p>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Rs. {provider.hourlyRate || 85}
                    <span className="text-sm font-normal text-gray-500">
                      /hour
                    </span>
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-600 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Available Today
                </span>
              </div>

              {dateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-red-600">{dateError}</p>
                </div>
              )}

              {/* Calendar Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowManualInput(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${!showManualInput ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" /> Calendar
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${showManualInput ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Edit2 className="w-4 h-4 inline mr-2" /> Manual Entry
                </button>
              </div>

              {/* Calendar View */}
              {!showManualInput && (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {currentMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map(({ date, isCurrentMonth }, index) => {
                        const isSelectedDate = isSelected(date);
                        const isTodayDate = isToday(date);
                        const isPast = isPastDate(date);
                        const hasNoSlots =
                          !isPast && !hasAvailableTimeSlots(date);
                        const isDisabled =
                          !isCurrentMonth || isPast || hasNoSlots;
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(date)}
                            disabled={isDisabled}
                            className={`h-10 rounded-lg text-sm font-medium transition ${!isCurrentMonth ? "text-gray-300 cursor-not-allowed opacity-50" : ""}
                              ${isPast ? "text-gray-300 cursor-not-allowed opacity-50 bg-gray-100" : ""}
                              ${hasNoSlots && !isPast ? "text-orange-400 cursor-not-allowed opacity-60 bg-orange-50 border border-orange-200" : ""}
                              ${isSelectedDate && !isDisabled ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md scale-105" : ""}
                              ${isTodayDate && !isSelectedDate && !isDisabled ? "border-2 border-blue-300 bg-blue-50 text-blue-600" : ""}
                              ${!isSelectedDate && !isDisabled && !isPast && !hasNoSlots ? "hover:bg-gray-100 hover:scale-105 text-gray-700" : ""}`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={handlePrevWeek}
                        className="flex-1 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        ← Previous Week
                      </button>
                      <button
                        onClick={handleNextWeek}
                        className="flex-1 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Next Week →
                      </button>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="mb-6">
                    <p className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Select Time
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => {
                        const isPast = isTimeSlotPast(slot, selectedDate);
                        const isSelected = selectedTime === slot.display;
                        return (
                          <button
                            key={slot.display}
                            onClick={() =>
                              !isPast && setSelectedTime(slot.display)
                            }
                            disabled={isPast}
                            className={`py-2.5 rounded-lg text-sm font-medium transition ${isSelected && !isPast ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md scale-105" : ""}
                              ${!isSelected && !isPast ? "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105" : ""}
                              ${isPast ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 line-through" : ""}`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Manual Input */}
              {showManualInput && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" /> Select Date
                    </label>
                    <input
                      type="date"
                      value={manualDate || formatDateForInput(selectedDate)}
                      onChange={handleManualDateChange}
                      min={formatDateForInput(new Date())}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Selected: {formatDisplayDate(selectedDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" /> Select Time
                    </label>
                    <input
                      type="time"
                      value={manualTime}
                      onChange={handleManualTimeChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {selectedTime && (
                      <p className="text-xs text-green-600 mt-2">
                        Selected time: {selectedTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">
                    Contact Details
                  </h3>
                  <span className="text-xs text-red-500 ml-auto">
                    * Required
                  </span>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={contactDetails.phoneNumber}
                      onChange={handleContactChange}
                      placeholder="Enter your phone number"
                      className={`w-full border ${contactErrors.phoneNumber ? "border-red-500" : "border-gray-200"} rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                    />
                  </div>
                  {contactErrors.phoneNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {contactErrors.phoneNumber}
                    </p>
                  )}
                  {!loadingProfile && contactDetails.phoneNumber && (
                    <p className="text-xs text-green-600 mt-1">
                      <CheckCircle className="w-3 h-3 inline mr-1" /> Using
                      saved phone number
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact{" "}
                    <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={contactDetails.emergencyContact}
                      onChange={handleContactChange}
                      placeholder="Emergency contact number"
                      className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    For urgent situations only
                  </p>
                </div>
              </div>

              {/* Address & Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" /> Service Address
                </label>
                <input
                  type="text"
                  placeholder="Enter your full address"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" /> Special
                  Instructions (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Any specific details about the service..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingSuccess}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold transition hover:from-blue-700 hover:to-blue-600 hover:shadow-lg disabled:opacity-50"
              >
                {bookingSuccess ? "Processing..." : "Book Now →"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                You won't be charged yet. Payment will be collected after
                service completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">ServEase</h3>
              </div>
              <p className="text-sm leading-relaxed max-w-xs text-gray-400">
                Your trusted platform for finding reliable local service
                providers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">About</h4>
              <ul className="space-y-3 text-sm">
                {["About Us", "How It Works", "Careers", "Blog"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">
                Policies
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  "Privacy Policy",
                  "Terms of Service",
                  "Refund Policy",
                  "Cookie Policy",
                ].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3 hover:text-white transition">
                  <Mail className="w-4 h-4 text-blue-400" />{" "}
                  serveease2082@gmail.com
                </li>
                <li className="flex items-center gap-3 hover:text-white transition">
                  <Phone className="w-4 h-4 text-blue-400" /> +977 9812021764
                </li>
                <li className="flex items-center gap-3 hover:text-white transition">
                  <MapPinIcon className="w-4 h-4 text-blue-400" />
                  Basantapur, Kathmandu
                </li>
              </ul>
              <div className="flex gap-3 mt-8">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={index}
                      className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 hover:scale-110 transition group"
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2024 ServEase. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">
              Made with ❤️ for better service experiences
            </p>
          </div>
        </div>
      </footer>

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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
