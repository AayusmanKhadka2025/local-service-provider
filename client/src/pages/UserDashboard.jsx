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
} from "lucide-react";
import ProfileSettings from "./ProfileSettings"; // Import ProfileSettings component

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications] = useState(3);
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "https://i.pravatar.cc/100?u=default",
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      // Get user data from localStorage (saved during login)
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);

          // Construct full avatar URL if it's a relative path
          let avatarUrl = userData.avatar;
          if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
            avatarUrl = `http://localhost:5050${avatarUrl}`;
          } else if (!avatarUrl) {
            avatarUrl = `https://i.pravatar.cc/100?u=${userData.email || "user"}`;
          }

          setUser({
            name: userData.fullName || userData.name || "User",
            email: userData.email || "",
            avatar: avatarUrl,
          });
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      } else {
        // If no user data, redirect to login
        navigate("/login");
      }
    };

    loadUserData();
  }, [navigate]);

  // Update handleProfileUpdate function
  const handleProfileUpdate = (updatedUser) => {
    // Construct full avatar URL if needed
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

  // Handle new booking button click - Navigate to ServiceListing page
  const handleNewBookingClick = () => {
    navigate("/service-listing");
  };

  // Add to UserDashboard component
  const [bookings, setBookings] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user bookings
  // Update the useEffect in UserDashboard.jsx
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5050/api/bookings/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          setBookings(response.data.bookings);
          // Filter unread notifications (pending status changes)
          const unreadBookings = response.data.bookings.filter(
            (b) => b.status === "confirmed" || b.status === "rejected",
          );
          setNotificationsList(unreadBookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, []); // Empty dependency array is fine here

  // Update the stats to use real data
  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length.toString(),
      icon: CalendarPlus,
      color: "blue",
    },
    {
      label: "Upcoming Bookings",
      value: bookings.filter((b) => b.status === "confirmed").length.toString(),
      icon: Clock,
      color: "yellow",
    },
    {
      label: "Completed Bookings",
      value: bookings.filter((b) => b.status === "completed").length.toString(),
      icon: CheckCircle,
      color: "green",
    },
  ];

  // Update upcomingBookings to use real data
  const upcomingBookings = bookings
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .map((booking) => ({
      id: booking._id,
      provider: booking.provider.name,
      providerName: booking.provider.name,
      providerImage: `https://ui-avatars.com/api/?name=${booking.provider.name}&background=3b82f6&color=fff`,
      service: booking.service,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      status: booking.status,
      price: `$${booking.totalAmount}`,
    }));

  // Update recentBookings to use real data
  const recentBookings = bookings
    .filter((b) => b.status === "completed" || b.status === "rejected")
    .slice(0, 6)
    .map((booking) => ({
      id: booking._id,
      provider: booking.provider.name,
      providerName: booking.provider.name,
      providerImage: `https://ui-avatars.com/api/?name=${booking.provider.name}&background=3b82f6&color=fff`,
      service: booking.service,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      price: `$${booking.totalAmount}`,
      rating: 4.5, // This would come from actual ratings
    }));

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
    { id: "support", label: "Help & Support", icon: HelpCircle },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      confirmed: "bg-green-100 text-green-700 border border-green-200",
      completed: "bg-blue-100 text-blue-700 border border-blue-200",
    };
    return colors[status] || colors.pending;
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
                className="w-3 h-3 fill-yellow-400 text-yellow-400"
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className="w-3 h-3 text-gray-300" />
                <Star
                  className="w-3 h-3 fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </div>
            );
          } else {
            return <Star key={i} className="w-3 h-3 text-gray-300" />;
          }
        })}
        <span className="text-xs text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    // Redirect to login page
    navigate("/login");
  };

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
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
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      {stat.value}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
                  </div>
                );
              })}
            </div>

            {/* Upcoming Bookings */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Upcoming Bookings
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4">
                        {/* Provider Image */}
                        <img
                          src={booking.providerImage}
                          alt={booking.providerName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {booking.provider}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.service}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {booking.date} • {booking.time}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Provider: {booking.providerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(booking.status)}`}
                          >
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                          <p className="text-sm font-semibold text-gray-700 mt-1">
                            {booking.price}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                          <XCircle className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Bookings */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Bookings
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4">
                        {/* Provider Image */}
                        <img
                          src={booking.providerImage}
                          alt={booking.providerName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {booking.provider}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.service}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {booking.date} • {booking.time}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Provider: {booking.providerName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor("completed")}`}
                        >
                          Completed
                        </span>
                        <p className="text-sm font-semibold text-gray-700 mt-1">
                          {booking.price}
                        </p>
                        <div className="flex items-center justify-end mt-1">
                          {renderStars(booking.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        );
      case "profile":
        return <ProfileSettings onProfileUpdate={handleProfileUpdate} />;
      case "support":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur-sm flex-col p-6 fixed left-0 top-0 h-screen border-r border-gray-200 shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            ServEase
          </h2>
        </div>

        {/* User Profile */}
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

        {/* Navigation */}
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-72 overflow-y-auto">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {activeTab === "profile"
                    ? "Profile Settings"
                    : `Welcome back, ${user.name.split(" ")[0]}! 👋`}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "profile"
                    ? "Manage your personal details and account security"
                    : "Here's what's happening with your bookings today"}
                </p>
              </div>

              {/* Action Buttons - New Booking button navigates to ServiceListing */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewBookingClick}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>New Booking</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6 text-gray-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-400 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                      {notifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default UserDashboard;
