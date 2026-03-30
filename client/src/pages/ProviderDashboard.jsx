import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Only import once
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
  TrendingUp,
  Briefcase
} from "lucide-react";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [provider, setProvider] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Service Provider",
    avatar: "https://i.pravatar.cc/100?u=default",
    rating: 0,
    totalBookings: 0,
    pendingRequests: 0,
    memberSince: "",
    category: "",
    experience: "",
    description: "",
    availableDays: [],
    address: "",
    city: "",
    hourlyRate: 0,
    serviceArea: "",
    serviceTags: []
  });

  // Load provider data from localStorage on mount
  useEffect(() => {
    const loadProviderData = () => {
      const storedProvider = localStorage.getItem('provider');
      const providerToken = localStorage.getItem('providerToken');
      const userType = localStorage.getItem('userType');
      
      // Check if provider is logged in
      if (!storedProvider || !providerToken || userType !== 'provider') {
        navigate('/login');
        return;
      }

      try {
        const providerData = JSON.parse(storedProvider);
        
        // Construct full avatar URL if it's a relative path
        let avatarUrl = providerData.profileImage || providerData.avatar;
        if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
          avatarUrl = `http://localhost:5050${avatarUrl}`;
        } else if (!avatarUrl) {
          avatarUrl = `https://i.pravatar.cc/100?u=${providerData.email || 'provider'}`;
        }
        
        setProvider({
          firstName: providerData.firstName || "",
          lastName: providerData.lastName || "",
          fullName: `${providerData.firstName || ""} ${providerData.lastName || ""}`.trim(),
          email: providerData.email || "",
          phone: providerData.phone || "",
          role: "Service Provider",
          avatar: avatarUrl,
          rating: providerData.rating || 4.5,
          totalBookings: providerData.completedJobs || 0,
          pendingRequests: 0,
          memberSince: providerData.createdAt ? new Date(providerData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "January 2024",
          category: providerData.category || "",
          experience: providerData.experience || "",
          description: providerData.description || "",
          availableDays: providerData.availableDays || [],
          address: providerData.address || "",
          city: providerData.city || "",
          hourlyRate: providerData.hourlyRate || 0,
          serviceArea: providerData.serviceArea || "",
          serviceTags: providerData.serviceTags || []
        });
      } catch (error) {
        console.error("Error parsing provider data:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [navigate]);

  // Fetch provider bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('providerToken');
        const response = await axios.get('http://localhost:5050/api/bookings/provider', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setBookings(response.data.bookings);
          const pending = response.data.bookings.filter(b => b.status === 'pending');
          setPendingRequests(pending);
          setNotifications(pending);
          setNotificationsCount(pending.length);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
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

  // Handle accept/reject
  const handleAccept = async (bookingId) => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await axios.put(
        'http://localhost:5050/api/bookings/status',
        { bookingId, status: 'confirmed' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Refresh bookings
        const updatedBookings = await axios.get('http://localhost:5050/api/bookings/provider', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBookings(updatedBookings.data.bookings);
        const pending = updatedBookings.data.bookings.filter(b => b.status === 'pending');
        setPendingRequests(pending);
        setNotifications(pending);
        setNotificationsCount(pending.length);
        
        alert('Booking accepted successfully!');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking');
    }
  };

  const handleReject = async (bookingId) => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await axios.put(
        'http://localhost:5050/api/bookings/status',
        { bookingId, status: 'rejected' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Refresh bookings
        const updatedBookings = await axios.get('http://localhost:5050/api/bookings/provider', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBookings(updatedBookings.data.bookings);
        const pending = updatedBookings.data.bookings.filter(b => b.status === 'pending');
        setPendingRequests(pending);
        setNotifications(pending);
        setNotificationsCount(pending.length);
        
        alert('Booking rejected');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await axios.put(
        'http://localhost:5050/api/bookings/status',
        { bookingId, status: 'completed' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Refresh bookings
        const updatedBookings = await axios.get('http://localhost:5050/api/bookings/provider', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBookings(updatedBookings.data.bookings);
        
        alert('Booking marked as completed!');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Failed to mark as completed');
    }
  };

  // Update the requests mapping
  const requests = pendingRequests.map(booking => ({
    id: booking._id,
    name: booking.user.name,
    service: booking.service,
    address: booking.user.address,
    phone: booking.user.phone,
    date: new Date(booking.date).toLocaleDateString(),
    time: booking.time,
    status: booking.status
  }));

  // Update completed bookings
  const completed = bookings
    .filter(b => b.status === 'completed' || b.status === 'rejected')
    .map(booking => ({
      id: booking._id,
      name: booking.user.name,
      service: booking.service,
      address: booking.user.address,
      phone: booking.user.phone,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      rating: 5,
      price: `$${booking.totalAmount}`,
      status: booking.status
    }));

  const stats = [
    { label: "Total Bookings", value: bookings.length.toString(), icon: Briefcase, color: "blue", trend: "+12%" },
    { label: "Pending Requests", value: pendingRequests.length.toString(), icon: Clock, color: "orange", trend: "+3" },
    { label: "Total Rating", value: provider.rating.toString(), icon: Star, color: "yellow", suffix: "⭐", trend: "+0.2" },
  ];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />;
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className="w-3 h-3 text-gray-300" />
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
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

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-orange-100 text-orange-700 border border-orange-200",
      accepted: "bg-green-100 text-green-700 border border-green-200",
      completed: "bg-blue-100 text-blue-700 border border-blue-200",
    };
    return colors[status] || colors.pending;
  };

  const handleLogout = () => {
    localStorage.removeItem("provider");
    localStorage.removeItem("providerToken");
    localStorage.removeItem("userType");
    navigate("/login");
  };

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
                  orange: "from-orange-500 to-orange-400",
                  yellow: "from-yellow-500 to-yellow-400",
                };
                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <h2 className="text-2xl font-bold text-gray-800 mt-1">
                      {stat.value} {stat.suffix && <span className="text-sm font-normal">{stat.suffix}</span>}
                    </h2>
                    {stat.label === "Total Rating" && (
                      <div className="mt-2">
                        {renderStars(provider.rating)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent Booking Requests */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Booking Requests
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {requests.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{item.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 ml-13">
                          <p className="text-sm text-blue-600 font-medium">{item.service}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{item.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{item.date}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleAccept(item.id)}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Completed Bookings */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Completed Bookings
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {completed.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{item.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 ml-13">
                          <p className="text-sm text-gray-600">{item.service}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{item.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{item.date}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          {item.status === 'completed' ? 'Completed' : 'Rejected'}
                        </span>
                        <p className="text-sm font-semibold text-gray-700 mt-2">{item.price}</p>
                        <div className="mt-1">
                          {renderStars(item.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        );

      case "earnings":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Earnings Overview</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$4,250</p>
                <p className="text-xs text-green-600 mt-2">↑ +23% this month</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$1,280</p>
                <p className="text-xs text-green-600 mt-2">↑ +8% from last month</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <p className="text-sm text-gray-600">Average per Job</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">$145</p>
                <p className="text-xs text-gray-500 mt-2">Based on {bookings.length} jobs</p>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <img 
                  src={provider.avatar} 
                  className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover" 
                  alt={provider.fullName}
                  onError={(e) => {
                    e.target.src = "https://i.pravatar.cc/100?u=default";
                  }}
                />
                <div>
                  <h3 className="text-xl font-semibold">{provider.fullName || `${provider.firstName} ${provider.lastName}`}</h3>
                  <p className="text-gray-500">{provider.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(provider.rating)}
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{provider.firstName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{provider.lastName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{provider.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{provider.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Service Category</p>
                  <p className="font-medium">{provider.category || "Not specified"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{provider.experience || "Not specified"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                  <p className="font-medium">${provider.hourlyRate}/hr</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Service Area</p>
                  <p className="font-medium">{provider.serviceArea || "Not specified"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{provider.address}, {provider.city}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Available Days</p>
                  <p className="font-medium">{provider.availableDays?.length ? provider.availableDays.join(", ") : "Not specified"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{provider.memberSince}</p>
                </div>
              </div>
              {provider.serviceTags && provider.serviceTags.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Service Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.serviceTags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Help & Support</h2>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How do I manage my bookings?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How do I update my availability?
                  </li>
                  <li className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> How are payments processed?
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Contact Support</h3>
                <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md">
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

  const fullName = `${provider.firstName} ${provider.lastName}`.trim();

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

        {/* Provider Profile */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6 border border-blue-100">
          <img
            src={provider.avatar}
            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
            alt={fullName}
            onError={(e) => {
              e.target.src = "https://i.pravatar.cc/100?u=default";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{fullName || "Provider"}</p>
            <p className="text-xs text-blue-600 font-medium">{provider.role}</p>
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
                <Icon className={`w-5 h-5 ${
                  activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`} />
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
                  Welcome back, {provider.firstName || "Provider"}! 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Here's what's happening with your business today.
                </p>
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-400 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                    {notificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default ProviderDashboard;