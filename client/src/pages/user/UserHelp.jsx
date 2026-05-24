import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Send,
  Paperclip,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Star,
  Shield,
  Eye
} from "lucide-react";

// Ticket Detail Modal for User
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
              <p className="text-blue-100 text-sm mt-1">Status: {ticket.status}</p>
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
              <h4 className="font-semibold text-gray-800">Your Message</h4>
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

const UserHelp = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState("faq");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [supportRequests, setSupportRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const fileInputRef = useRef(null);

  // FAQ data for Users
  const userFaqs = [
    {
      id: 1,
      title: "How do I book a service?",
      content: "To book a service:\n1. Go to the Service Listing page\n2. Browse through available providers\n3. Click 'View Details' on a provider\n4. Select your preferred date and time\n5. Enter your address and contact details\n6. Click 'Book Now' to confirm your booking",
    },
    {
      id: 2,
      title: "How can I cancel a booking?",
      content: "You can cancel a booking from your Dashboard:\n1. Go to 'Upcoming Bookings'\n2. Find the booking you want to cancel\n3. Click the 'Cancel' button\n4. Confirm cancellation\nNote: Only pending bookings can be cancelled.",
    },
    {
      id: 3,
      title: "How do I leave a review for a provider?",
      content: "After a service is completed:\n1. Go to your Dashboard\n2. Find the completed booking in 'Recent Booking History'\n3. Click the 'Review' button\n4. Rate the provider (1-5 stars)\n5. Write your feedback\n6. Submit your review",
    },
    {
      id: 4,
      title: "Can I edit or update my review?",
      content: "Yes! If you've already left a review:\n1. Go to your Dashboard\n2. Find the booking in 'Recent Booking History'\n3. Click the 'Edit Review' button\n4. Update your rating and/or review\n5. Submit the changes",
    },
    {
      id: 5,
      title: "How does payment work?",
      content: "Payments are processed through eSewa after service completion:\n- You won't be charged at the time of booking\n- When the provider completes the service, a payment link will appear\n- Click 'Pay Now' to complete the payment via eSewa\n- You'll receive a payment confirmation",
    },
    {
      id: 6,
      title: "What if the provider doesn't show up?",
      content: "If a provider doesn't show up for a confirmed booking:\n1. Contact our support team immediately\n2. Provide your booking details\n3. We'll investigate and help you find an alternative provider\n4. You may be eligible for a refund or compensation",
    },
    {
      id: 7,
      title: "How are providers verified?",
      content: "All providers undergo a thorough verification process:\n- Government ID verification\n- Portfolio/work sample submission\n- Background check\n- Admin review and approval\nVerified providers have a verification badge on their profile.",
    },
    {
      id: 8,
      title: "What should I do if I have an issue with a provider?",
      content: "If you experience any issues:\n1. First, try communicating with the provider via chat\n2. If unresolved, contact our support team\n3. Provide booking details and describe the issue\n4. Our team will mediate and help resolve the matter",
    },
  ];

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "error");
        return;
      }
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitSupport = async (e) => {
    e.preventDefault();

    if (!contactForm.subject.trim()) {
      showToast("Please enter a subject", "error");
      return;
    }
    if (!contactForm.message.trim()) {
      showToast("Please enter your message", "error");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("subject", contactForm.subject);
      formData.append("message", contactForm.message);
      formData.append("userType", "user");
      if (attachment) {
        formData.append("attachments", attachment);
      }

      const response = await axios.post(
        "http://localhost:5050/api/support/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        showToast("Support request sent successfully! We'll get back to you soon.", "success");
        setContactForm({ subject: "", message: "" });
        removeAttachment();
        // Refresh tickets list if on contact tab
        if (activeTab === "contact") {
          fetchSupportRequests();
        }
      }
    } catch (error) {
      console.error("Error sending support request:", error);
      showToast(error.response?.data?.message || "Failed to send support request", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportRequests = async () => {
    setFetchingRequests(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5050/api/support/user",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setSupportRequests(response.data.tickets);
      }
    } catch (error) {
      console.error("Error fetching support requests:", error);
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "contact") {
      fetchSupportRequests();
    }
  };

  const viewTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Ticket Detail Modal */}
      {showTicketDetailModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setShowTicketDetailModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Help & Support</h2>
            <p className="text-blue-100 mt-1">
              Get answers to your questions or contact our support team
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleTabChange("faq")}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === "faq"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Frequently Asked Questions
        </button>
        <button
          onClick={() => handleTabChange("contact")}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === "contact"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Contact Support Team
        </button>
      </div>

      {/* FAQ Section */}
      {activeTab === "faq" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-semibold text-gray-800">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quick answers to common questions
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {userFaqs.map((faq) => (
              <div key={faq.id} className="p-4">
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                  }
                  className="w-full flex justify-between items-center text-left"
                >
                  <span className="font-medium text-gray-800">{faq.title}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-blue-200 whitespace-pre-line">
                    {faq.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Support Section */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800">
                Send us a message
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Describe your issue and we'll get back to you
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitSupport} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Issue with booking, Provider not responding, etc."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="5"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    placeholder="Please describe your issue in detail..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <Paperclip className="w-4 h-4" />
                      Choose File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachmentChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <span className="text-xs text-gray-400">
                      Max 5MB (images or PDF)
                    </span>
                  </div>

                  {attachmentPreview && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={attachmentPreview}
                        alt="Attachment preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Support Requests History */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Support Requests
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track the status of your previous inquiries
              </p>
            </div>
            <div className="p-6">
              {fetchingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : supportRequests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No support requests yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your inquiries will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportRequests.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {ticket.subject}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.message}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          {ticket.adminReplies && ticket.adminReplies.length > 0 && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {ticket.adminReplies.length} reply
                            </span>
                          )}
                          <button
                            onClick={() => viewTicketDetails(ticket)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <a
                href="mailto:servease2082@gmail.com"
                className="text-blue-600 font-medium hover:underline block mt-2"
              >
                servease2082@gmail.com
              </a>
              <p className="text-xs text-gray-400 mt-3">
                Response within 24-48 hours
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-800">Phone Support</h4>
              </div>
              <p className="text-sm text-gray-600">For urgent matters</p>
              <a
                href="tel:+9779812021764"
                className="text-green-600 font-medium hover:underline block mt-2"
              >
                +977 9812021764
              </a>
              <p className="text-xs text-gray-400 mt-3">Mon-Fri, 9AM - 6PM</p>
            </div>
          </div>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default UserHelp;