import { useState, useEffect, useRef } from "react";
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
  Trash2,
  Send,
  Paperclip,
  RefreshCw
} from "lucide-react";

// Reply Modal Component
const ReplyModal = ({ ticket, onClose, onReply }) => {
  const [replyMessage, setReplyMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreviews(prev => [...prev, { name: file.name, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!replyMessage.trim()) {
      alert("Please enter a reply message");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("ticketId", ticket._id);
    formData.append("message", replyMessage);
    attachments.forEach(file => {
      formData.append("attachments", file);
    });
    
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        "http://localhost:5050/api/support/admin/reply",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      if (response.data.success) {
        onReply(response.data.reply);
        onClose();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert(error.response?.data?.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">Reply to Support Ticket</h3>
              <p className="text-blue-100 text-sm mt-1">Subject: {ticket.subject}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reply Message</label>
            <textarea
              rows="5"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Type your reply here..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Add Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAttachmentChange}
              accept="image/*,.pdf,.doc,.docx"
              multiple
              className="hidden"
            />
            
            {attachmentPreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachmentPreviews.map((att, idx) => (
                  <div key={idx} className="relative">
                    {att.preview.startsWith('data:image') ? (
                      <img src={att.preview} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket Detail Modal
const TicketDetailModal = ({ ticket, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white sticky top-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{ticket.subject}</h3>
              <p className="text-blue-100 text-sm mt-1">
                From: {ticket.userName} ({ticket.userType}) • Status: {ticket.status}
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Original Message */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">User's Message</h4>
              <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {ticket.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      {att.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Admin Replies */}
          {ticket.adminReplies && ticket.adminReplies.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                Admin Replies
              </h4>
              <div className="space-y-4">
                {ticket.adminReplies.map((reply, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-blue-800">{reply.adminName}</p>
                      <p className="text-xs text-blue-400">{formatDate(reply.createdAt)}</p>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {reply.attachments.map((att, attIdx) => (
                          <a
                            key={attIdx}
                            href={att.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                          >
                            <Paperclip className="w-3 h-3" />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserSupport = () => {
  const [activeSection, setActiveSection] = useState("help");
  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState("all");
  const [ticketSearchTerm, setTicketSearchTerm] = useState("");
  
  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch support tickets
  const fetchSupportTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5050/api/support/admin/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSupportTickets(response.data.tickets);
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      showToast("Failed to load support tickets", "error");
    } finally {
      setLoadingTickets(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        "http://localhost:5050/api/support/admin/status",
        { ticketId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSupportTickets(prev =>
          prev.map(ticket =>
            ticket._id === ticketId ? { ...ticket, status } : ticket
          )
        );
        showToast(`Ticket marked as ${status}`, "success");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      showToast("Failed to update status", "error");
    }
  };

  // Handle reply to ticket
  const handleReply = (ticket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
  };

  const onReplySent = (reply) => {
    setSupportTickets(prev =>
      prev.map(ticket =>
        ticket._id === selectedTicket._id
          ? { ...ticket, adminReplies: [...(ticket.adminReplies || []), reply], status: "in_progress" }
          : ticket
      )
    );
    showToast("Reply sent successfully", "success");
  };

  // Open delete confirmation modal
  const openDeleteModal = (bookingId, reportId) => {
    setDeleteTarget({ bookingId, reportId });
    setShowDeleteModal(true);
  };

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
    } else if (activeSection === "help") {
      fetchSupportTickets();
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

  // Handle delete review
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
        await updateReportStatus(deleteTarget.reportId, "action_taken");
        
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

  // Filter tickets
  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticketSearchTerm === "" ||
      ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(ticketSearchTerm.toLowerCase());
    const matchesStatus = ticketFilterStatus === "all" || ticket.status === ticketFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    pending: reportedReviews.filter(r => r.status === "pending").length,
    reviewed: reportedReviews.filter(r => r.status === "reviewed").length,
    actionTaken: reportedReviews.filter(r => r.status === "action_taken").length,
    dismissed: reportedReviews.filter(r => r.status === "dismissed").length,
    total: reportedReviews.length
  };

  const ticketStats = {
    pending: supportTickets.filter(t => t.status === "pending").length,
    in_progress: supportTickets.filter(t => t.status === "in_progress").length,
    resolved: supportTickets.filter(t => t.status === "resolved").length,
    closed: supportTickets.filter(t => t.status === "closed").length,
    total: supportTickets.length
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

  const getTicketStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "closed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
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

  const getUserAvatar = (userName, userAvatar) => {
    if (userAvatar && userAvatar !== "" && userAvatar !== "http://localhost:5050null") {
      return userAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=3b82f6&color=fff&size=80&bold=true`;
  };

  const getProviderAvatar = (providerName, providerAvatar) => {
    if (providerAvatar && providerAvatar !== "" && providerAvatar !== "http://localhost:5050null") {
      return providerAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName || 'Provider')}&background=2563eb&color=fff&size=80&bold=true`;
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

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <ReplyModal
          ticket={selectedTicket}
          onClose={() => setShowReplyModal(false)}
          onReply={onReplySent}
        />
      )}

      {/* Ticket Detail Modal */}
      {showTicketDetailModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setShowTicketDetailModal(false)}
        />
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

      {/* Help & Support Section - Ticket Management */}
      {activeSection === "help" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Support Tickets</h2>
                <p className="text-blue-100 text-sm">Manage and respond to user and provider support requests</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">{ticketStats.pending}</p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{ticketStats.in_progress}</p>
              <p className="text-xs text-blue-600">In Progress</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{ticketStats.resolved}</p>
              <p className="text-xs text-green-600">Resolved</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-2xl font-bold text-gray-700">{ticketStats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by subject, user name, or email..."
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={ticketFilterStatus}
                  onChange={(e) => setTicketFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={fetchSupportTickets}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          {loadingTickets ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No support tickets</h3>
              <p className="text-gray-500">When users or providers submit support requests, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getTicketStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className="text-xs text-gray-400">#{ticket._id.slice(-8)}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{ticket.userType}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800">{ticket.subject}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{ticket.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{ticket.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(ticket)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Reply
                        </button>
                        {ticket.status !== "resolved" && ticket.status !== "closed" && (
                          <button
                            onClick={() => updateTicketStatus(ticket._id, "resolved")}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketDetailModal(true);
                          }}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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