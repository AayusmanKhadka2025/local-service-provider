// client/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  ChevronRight,
  Bell,
  Shield,
  Menu,
  X,
  LogOut,
  Users,
  UserCheck,
  Eye,
  Clock,
  Award,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
import UserManagement from "../admin/UserManagement";
import ProviderManagement from "../admin/ProviderManagement";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState(0);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    pendingProviders: 0
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("admin");
    const userType = localStorage.getItem("userType");

    if (!adminToken || !adminData || userType !== "admin") {
      navigate("/login");
      return;
    }

    try {
      setAdmin(JSON.parse(adminData));
      fetchDashboardData();
      fetchProviders();
    } catch (error) {
      console.error("Error parsing admin data:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5050/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
        setNotifications(response.data.stats.pendingProviders);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5050/api/admin/providers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProviders(response.data.providers);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const handleVerifyProvider = async (providerId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5050/api/admin/providers/${providerId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchProviders();
        await fetchDashboardData();
        setShowProviderModal(false);
        showToast("Provider verified successfully!", "success");
      }
    } catch (error) {
      console.error("Error verifying provider:", error);
      showToast("Failed to verify provider", "error");
    }
  };

  const handleRejectProvider = async (providerId) => {
    if (!window.confirm("Are you sure you want to reject this provider?")) return;
    
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5050/api/admin/providers/${providerId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchProviders();
        await fetchDashboardData();
        setShowProviderModal(false);
        showToast("Provider rejected successfully!", "success");
      }
    } catch (error) {
      console.error("Error rejecting provider:", error);
      showToast("Failed to reject provider", "error");
    }
  };

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "providers", label: "Service Providers", icon: UserCheck },
    { id: "complaints", label: "Complaints", icon: Shield },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
    { label: "Service Providers", value: stats.totalProviders, icon: UserCheck, color: "green" },
    { label: "Pending Verifications", value: stats.pendingProviders, icon: Shield, color: "orange" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-orange-100 text-orange-700 border border-orange-200",
      verified: "bg-green-100 text-green-700 border border-green-200",
      rejected: "bg-red-100 text-red-700 border border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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

  const filteredPendingProviders = providers.filter(p => !p.isVerified && p.isActive !== false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
            toast.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Provider Details Modal */}
      {showProviderModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">Provider Details</h3>
                  <p className="text-blue-100 mt-1">Review provider information and take action</p>
                </div>
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={selectedProvider.profileImage || `https://ui-avatars.com/api/?name=${selectedProvider.firstName}+${selectedProvider.lastName}&background=3b82f6&color=fff&size=120`}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                  alt={selectedProvider.firstName}
                />
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {selectedProvider.firstName} {selectedProvider.lastName}
                  </h4>
                  <p className="text-blue-600 font-medium">{selectedProvider.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(selectedProvider.rating || 0)}
                    <span className="text-sm text-gray-500">({selectedProvider.totalReviews || 0} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Contact Information
                  </h5>
                  <div className="space-y-2">
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedProvider.email}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedProvider.phone}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedProvider.address}, {selectedProvider.city}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    Professional Information
                  </h5>
                  <div className="space-y-2">
                    <p className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">Experience: {selectedProvider.experience}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">Hourly Rate: ${selectedProvider.hourlyRate}/hr</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">Service Area: {selectedProvider.serviceArea || "Not specified"}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">Available Days: {selectedProvider.availableDays?.join(", ") || "Not specified"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Tags */}
              {selectedProvider.serviceTags && selectedProvider.serviceTags.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    Service Tags
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.serviceTags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  About Provider
                </h5>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                  {selectedProvider.description || "No description provided"}
                </p>
              </div>

              {/* Documents Section */}
              {selectedProvider.documents && (
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Uploaded Documents
                  </h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedProvider.documents.governmentId && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Government ID</p>
                        <p className="text-xs text-gray-500 mb-2">{selectedProvider.documents.governmentId.fileName}</p>
                        <button 
                          onClick={() => window.open(`http://localhost:5050${selectedProvider.documents.governmentId.filePath}`, '_blank')}
                          className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          View Document
                        </button>
                      </div>
                    )}
                    {selectedProvider.documents.portfolio && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Portfolio</p>
                        <p className="text-xs text-gray-500 mb-2">{selectedProvider.documents.portfolio.fileName}</p>
                        <button 
                          onClick={() => window.open(`http://localhost:5050${selectedProvider.documents.portfolio.filePath}`, '_blank')}
                          className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          View Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {selectedProvider.reviews && selectedProvider.reviews.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    Recent Reviews
                  </h5>
                  <div className="space-y-3">
                    {selectedProvider.reviews.slice(0, 3).map((review, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800">{review.userName}</p>
                            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-gray-600">"{review.review}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleVerifyProvider(selectedProvider._id)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Provider
                </button>
                <button
                  onClick={() => handleRejectProvider(selectedProvider._id)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

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
            src={`https://ui-avatars.com/api/?name=${admin?.fullName || 'Admin'}&background=3b82f6&color=fff&size=100`}
            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
            alt={admin?.fullName}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{admin?.fullName}</p>
            <p className="text-xs text-blue-600 font-medium capitalize">{admin?.role}</p>
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
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
          <aside className="fixed top-0 left-0 w-72 bg-white h-full z-40 shadow-xl md:hidden">
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
                  src={`https://ui-avatars.com/api/?name=${admin?.fullName || 'Admin'}&background=3b82f6&color=fff&size=100`}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                  alt={admin?.fullName}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{admin?.fullName}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">{admin?.role}</p>
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
      <main className="flex-1 ml-0 md:ml-72 overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {activeTab === "dashboard" 
                    ? `Welcome back, ${admin?.fullName?.split(' ')[0] || 'Admin'}! 👋`
                    : activeTab === "users"
                    ? "User Management"
                    : activeTab === "providers"
                    ? "Service Providers"
                    : "Complaints & Support"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "dashboard"
                    ? "Here's what's happening with your platform today."
                    : activeTab === "users"
                    ? "Manage and monitor all platform users"
                    : activeTab === "providers"
                    ? "Review and manage service provider applications"
                    : "Handle user complaints and support tickets"}
                </p>
              </div>

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
        </header>

        <div className="p-8">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  const colors = {
                    blue: "from-blue-500 to-blue-400",
                    green: "from-green-500 to-green-400",
                    orange: "from-orange-500 to-orange-400",
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
                        <span className="text-sm font-medium text-gray-400">{stat.label}</span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</h2>
                      <p className="text-sm text-gray-500 mt-2">Current total</p>
                    </div>
                  );
                })}
              </div>

              {/* Pending Verification Requests Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-800 text-lg">
                        Pending Verification Requests
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Review and approve service provider applications
                      </p>
                    </div>
                    
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search providers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Provider</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 hidden lg:table-cell">Experience</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingProviders.map((provider) => (
                        <tr key={provider._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={provider.profileImage || `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=100`} 
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                                alt={provider.firstName}
                              />
                              <div>
                                <p className="font-medium text-gray-800">{provider.firstName} {provider.lastName}</p>
                                <p className="text-xs text-blue-600">{provider.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div>
                              <p className="text-sm text-gray-600">{provider.email}</p>
                              <p className="text-xs text-gray-400">{provider.phone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{provider.experience}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor('pending')}`}>
                              <Clock className="w-3 h-3" />
                              Pending Review
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleViewDetails(provider)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredPendingProviders.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            No pending verification requests
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing {filteredPendingProviders.length} pending providers awaiting verification
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Users Management */}
          {activeTab === "users" && <UserManagement />}

          {/* Providers Management */}
          {activeTab === "providers" && <ProviderManagement />}

          {/* Complaints Tab Content */}
          {activeTab === "complaints" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Complaints & Support</h2>
              <p className="text-gray-500">Complaint management features coming soon...</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
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

export default AdminDashboard;