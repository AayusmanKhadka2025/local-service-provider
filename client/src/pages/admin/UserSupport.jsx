import { useState, useEffect } from "react";
import axios from "axios";
import {
  HelpCircle,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Star,
  User,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Flag,
  FileText,
  ExternalLink,
  AlertCircle,
  MessageCircle,
  LifeBuoy,
  BookOpen,
  X,
  Clock,
  UserCheck,
  Users,
  Trash2
} from "lucide-react";

const UserSupport = () => {
  const [activeSection, setActiveSection] = useState("help");
  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Help & Support state (kept for future user-facing implementation)
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Open delete confirmation modal
  const openDeleteModal = (bookingId, reportId) => {
    setDeleteTarget({ bookingId, reportId });
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  // Fetch reported reviews from backend
  useEffect(() => {
    const fetchReportedReviews = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");
        const response = await axios.get(
          "http://localhost:5050/api/admin/reported-reviews",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          console.log("Fetched reports:", response.data.reports);
          setReportedReviews(response.data.reports);
        }
      } catch (error) {
        console.error("Error fetching reported reviews:", error);
        showToast("Failed to load reported reviews", "error");
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === "complaints") {
      fetchReportedReviews();
    }
  }, [activeSection]);

  // Handle review report status update
  const updateReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5050/api/admin/reported-reviews/${reportId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReportedReviews(prev =>
          prev.map(report =>
            report._id === reportId ? { ...report, status } : report
          )
        );
        const statusMessages = {
          reviewed: "marked as reviewed",
          action_taken: "action taken",
          dismissed: "dismissed"
        };
        showToast(`Report ${statusMessages[status] || status}`, "success");
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      showToast("Failed to update report status", "error");
    }
  };

  // Handle delete review (admin action) - With confirmation modal
  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.delete(
        `http://localhost:5050/api/admin/reviews/${deleteTarget.bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update report status to action_taken
        await updateReportStatus(deleteTarget.reportId, "action_taken");
        
        // Refresh the reported reviews list
        const refreshResponse = await axios.get(
          "http://localhost:5050/api/admin/reported-reviews",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (refreshResponse.data.success) {
          setReportedReviews(refreshResponse.data.reports);
        }
        showToast("Review deleted successfully", "success");
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast(error.response?.data?.message || "Failed to delete review", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter reported reviews
  const filteredReports = reportedReviews.filter(report => {
    const matchesSearch = searchTerm === "" || 
      report.reportReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reviewText?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Statistics for badges
  const stats = {
    pending: reportedReviews.filter(r => r.status === "pending").length,
    reviewed: reportedReviews.filter(r => r.status === "reviewed").length,
    actionTaken: reportedReviews.filter(r => r.status === "action_taken").length,
    dismissed: reportedReviews.filter(r => r.status === "dismissed").length,
    total: reportedReviews.length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "action_taken":
        return "bg-green-100 text-green-700 border-green-200";
      case "dismissed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "reviewed":
        return <Eye className="w-3 h-3" />;
      case "action_taken":
        return <CheckCircle className="w-3 h-3" />;
      case "dismissed":
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "reviewed":
        return "Reviewed";
      case "action_taken":
        return "Action Taken";
      case "dismissed":
        return "Dismissed";
      default:
        return status;
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating || 0}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get user avatar with fallback
  const getUserAvatar = (userName, userAvatar) => {
    if (userAvatar && userAvatar !== "" && userAvatar !== "http://localhost:5050null") {
      return userAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=3b82f6&color=fff&size=80&bold=true`;
  };

  // Get provider avatar with fallback
  const getProviderAvatar = (providerName, providerAvatar) => {
    if (providerAvatar && providerAvatar !== "" && providerAvatar !== "http://localhost:5050null") {
      return providerAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName || 'Provider')}&background=2563eb&color=fff&size=80&bold=true`;
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    showToast("Support request sent! We'll get back to you soon.", "success");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Delete Review</h3>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Are you absolutely sure?</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This will permanently delete this review from the system. 
                      The provider's rating will be recalculated, and all associated reports will be marked as action taken.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Review being deleted:</p>
                <p className="text-sm text-gray-700 italic">
                  "{reportedReviews.find(r => r._id === deleteTarget.reportId)?.reviewText || 'Review content'}"
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReview}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection("help")}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            activeSection === "help"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Help & Support
        </button>
        <button
          onClick={() => setActiveSection("complaints")}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            activeSection === "complaints"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Shield className="w-4 h-4" />
          Complaints
        </button>
      </div>

      {/* Help & Support Section - Kept as is, will be used for users later */}
      {activeSection === "help" && (
        <div className="space-y-8">
          {/* Quick Help Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">How can we help you?</h2>
                <p className="text-blue-100 mt-1">Find answers to common questions or contact our support team</p>
              </div>
            </div>
          </div>

          {/* FAQ Section - Placeholder content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">Quick answers to common questions</p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-8 text-center text-gray-500">
                <p>Help & Support content will be available for users soon.</p>
              </div>
            </div>
          </div>

          {/* Contact Support Form - Placeholder */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Contact Support</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">Get in touch with our support team</p>
            </div>
            <div className="p-8 text-center text-gray-500">
              <p>Support form will be available for users soon.</p>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Email Support</h4>
              </div>
              <p className="text-sm text-gray-600">For non-urgent inquiries</p>
              <a href="mailto:servease2082@gmail.com" className="text-blue-600 font-medium hover:underline block mt-2">
                servease2082@gmail.com
              </a>
              <p className="text-xs text-gray-400 mt-3">Response within 24-48 hours</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-800">Phone Support</h4>
              </div>
              <p className="text-sm text-gray-600">For urgent matters</p>
              <a href="tel:+9779812021764" className="text-green-600 font-medium hover:underline block mt-2">
                +977 9812021764
              </a>
              <p className="text-xs text-gray-400 mt-3">Mon-Fri, 9AM - 6PM</p>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Section */}
      {activeSection === "complaints" && (
        <div className="space-y-6">
          {/* Header with Badges */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Reported Reviews</h3>
              <p className="text-sm text-gray-500 mt-1">Manage and resolve complaints from service providers</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending: {stats.pending}
              </div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Reviewed: {stats.reviewed}
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Action Taken: {stats.actionTaken}
              </div>
              <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Dismissed: {stats.dismissed}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by provider, user, reason, or review..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="all">All Status ({stats.total})</option>
                  <option value="pending">Pending ({stats.pending})</option>
                  <option value="reviewed">Reviewed ({stats.reviewed})</option>
                  <option value="action_taken">Action Taken ({stats.actionTaken})</option>
                  <option value="dismissed">Dismissed ({stats.dismissed})</option>
                </select>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-3 py-2.5 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reported Reviews List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No reported reviews</h3>
              <p className="text-gray-500">When providers report reviews, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Report Header - Provider Info */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProviderAvatar(report.providerName, report.providerAvatar)}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          alt={report.providerName}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.providerName || 'Provider')}&background=2563eb&color=fff&size=80&bold=true`;
                          }}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            Reported by: <span className="text-blue-600">{report.providerName}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{report.providerEmail || 'No email'}</span>
                            </div>
                            <span className="text-xs text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{report.providerCategory || 'No category'}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Reported on {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="p-5 space-y-5">
                    {/* Flagged Review with User Info */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h4 className="font-semibold text-red-700 text-sm">Flagged Review</h4>
                      </div>
                      
                      {/* User Information */}
                      <div className="flex items-start gap-4 mb-4 pb-3 border-b border-red-200">
                        <img
                          src={getUserAvatar(report.userName, report.userAvatar)}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          alt={report.userName}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.userName || 'User')}&background=3b82f6&color=fff&size=80&bold=true`;
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-base">{report.userName || 'Unknown User'}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{report.userEmail || 'No email'}</span>
                                </div>
                                {report.userPhone && report.userPhone !== 'No phone' && (
                                  <>
                                    <span className="text-xs text-gray-300">|</span>
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{report.userPhone}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {renderStars(report.rating || 0)}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(report.reviewCreatedAt || report.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Review Content */}
                      <div className="pl-4 border-l-2 border-red-200">
                        <p className="text-sm text-gray-700 italic">"{report.reviewText || 'No review content'}"</p>
                      </div>
                    </div>

                    {/* Report Reason */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="w-4 h-4 text-blue-500" />
                        <h4 className="font-semibold text-gray-700 text-sm">Report Reason</h4>
                      </div>
                      <p className="text-sm text-gray-700 font-medium bg-white p-2 rounded-lg border border-gray-100">
                        {report.reportReason || 'No reason provided'}
                      </p>
                      {report.reportDetails && (
                        <div className="mt-3 p-2 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Additional details:</span> {report.reportDetails}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {report.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report._id, "reviewed")}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Mark as Reviewed
                          </button>
                          <button
                            onClick={() => openDeleteModal(report.bookingId, report._id)}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Review
                          </button>
                          <button
                            onClick={() => updateReportStatus(report._id, "dismissed")}
                            className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Dismiss Report
                          </button>
                        </>
                      )}
                      {report.status === "reviewed" && (
                        <>
                          <button
                            onClick={() => openDeleteModal(report.bookingId, report._id)}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Review & Take Action
                          </button>
                          <button
                            onClick={() => updateReportStatus(report._id, "action_taken")}
                            className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Action Taken
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setExpandedComplaint(expandedComplaint === report._id ? null : report._id)}
                        className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {expandedComplaint === report._id ? "Show Less" : "View Full Details"}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedComplaint === report._id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h5 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                              <UserCheck className="w-3 h-3" />
                              Provider Information
                            </h5>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium text-gray-600">Name:</span> {report.providerName}</p>
                              <p><span className="font-medium text-gray-600">Email:</span> {report.providerEmail}</p>
                              <p><span className="font-medium text-gray-600">Category:</span> {report.providerCategory}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h5 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              User Information
                            </h5>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium text-gray-600">Name:</span> {report.userName}</p>
                              <p><span className="font-medium text-gray-600">Email:</span> {report.userEmail}</p>
                              <p><span className="font-medium text-gray-600">Phone:</span> {report.userPhone || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Reference Information
                          </h5>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-gray-600">Booking ID:</span> <code className="text-xs bg-white px-2 py-1 rounded">{report.bookingId}</code></p>
                            <p><span className="font-medium text-gray-600">Report ID:</span> <code className="text-xs bg-white px-2 py-1 rounded">{report._id}</code></p>
                            <p><span className="font-medium text-gray-600">Reported On:</span> {formatDate(report.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default UserSupport;