// client/src/components/admin/ProviderManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Eye,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  FileText,
  DollarSign,
  Tag,
  MessageSquare,
  Download,
  User,
  Briefcase,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";

const ProviderManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch providers
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5050/api/admin/providers",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setProviders(response.data.providers);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      showToast("Failed to load providers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this provider? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.delete(
        `http://localhost:5050/api/admin/providers/${providerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        await fetchProviders();
        setShowProviderModal(false);
        showToast("Provider deleted successfully!", "success");
      }
    } catch (error) {
      console.error("Error deleting provider:", error);
      showToast("Failed to delete provider", "error");
    }
  };

  const handleDeleteReview = async (providerId, reviewId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this review? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.delete(
        `http://localhost:5050/api/admin/providers/${providerId}/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        await fetchProviders();
        const updatedProvider = providers.find((p) => p._id === providerId);
        if (updatedProvider && showProviderModal) {
          setSelectedProvider(updatedProvider);
        }
        showToast("Review deleted successfully!", "success");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast("Failed to delete review", "error");
    }
  };

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const getStatusColor = (status) => {
    const colors = {
      verified: "bg-green-100 text-green-700 border border-green-200",
      rejected: "bg-red-100 text-red-700 border border-red-200",
      pending: "bg-orange-100 text-orange-700 border border-orange-200",
    };
    return colors[status] || colors.pending;
  };

  // Categorize providers
  const verifiedProviders = providers.filter(
    (provider) => provider.isVerified === true,
  );
  const rejectedProviders = providers.filter(
    (provider) => provider.isActive === false && !provider.isVerified,
  );
  const pendingProviders = providers.filter(
    (provider) => !provider.isVerified && provider.isActive !== false,
  );

  // For display - all providers for searching (but will be shown in categorized sections)
  const searchFiltered = (providerList) => {
    return providerList.filter(
      (provider) =>
        provider.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.serviceArea?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const filteredVerified = searchFiltered(verifiedProviders);
  const filteredRejected = searchFiltered(rejectedProviders);
  const filteredPending = searchFiltered(pendingProviders);

  // Statistics
  const totalActiveProviders = verifiedProviders.length;
  const totalRejectedProviders = rejectedProviders.length;
  const totalPendingProviders = pendingProviders.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}
            >
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
                  <p className="text-blue-100 mt-1">
                    Complete provider information
                  </p>
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
                  src={
                    selectedProvider.profileImage ||
                    `https://ui-avatars.com/api/?name=${selectedProvider.firstName}+${selectedProvider.lastName}&background=3b82f6&color=fff&size=120`
                  }
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                  alt={selectedProvider.firstName}
                />
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {selectedProvider.firstName} {selectedProvider.lastName}
                  </h4>
                  <p className="text-blue-600 font-medium">
                    {selectedProvider.category}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(selectedProvider.rating || 0)}
                    <span className="text-sm text-gray-500">
                      ({selectedProvider.totalReviews || 0} reviews)
                    </span>
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
                      <span className="text-gray-700">
                        {selectedProvider.email}
                      </span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {selectedProvider.phone}
                      </span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {selectedProvider.address}, {selectedProvider.city}
                      </span>
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
                      <span className="text-gray-700">
                        Experience: {selectedProvider.experience}
                      </span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Hourly Rate: ${selectedProvider.hourlyRate}/hr
                      </span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Service Area:{" "}
                        {selectedProvider.serviceArea || "Not specified"}
                      </span>
                    </p>
                    {/* Member Since - Only show for verified providers, not for rejected */}
                    {selectedProvider.isVerified && (
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          Member Since: {formatDate(selectedProvider.createdAt)}
                        </span>
                      </p>
                    )}
                    <p className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Available Days:{" "}
                        {selectedProvider.availableDays?.join(", ") ||
                          "Not specified"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Tags */}
              {selectedProvider.serviceTags &&
                selectedProvider.serviceTags.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      Service Tags
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.serviceTags.map((tag, index) => (
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
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Government ID
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {selectedProvider.documents.governmentId.fileName}
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              `http://localhost:5050${selectedProvider.documents.governmentId.filePath}`,
                              "_blank",
                            )
                          }
                          className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          View Document
                        </button>
                      </div>
                    )}
                    {selectedProvider.documents.portfolio && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Portfolio
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {selectedProvider.documents.portfolio.fileName}
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              `http://localhost:5050${selectedProvider.documents.portfolio.filePath}`,
                              "_blank",
                            )
                          }
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

              {/* Reviews Section with Delete Button */}
              {selectedProvider.reviews &&
                selectedProvider.reviews.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      Recent Reviews
                    </h5>
                    <div className="space-y-3">
                      {selectedProvider.reviews.map((review, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                {review.userName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <button
                                onClick={() =>
                                  handleDeleteReview(
                                    selectedProvider._id,
                                    review._id,
                                  )
                                }
                                className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                title="Delete Review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            "{review.review}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Delete Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeleteProvider(selectedProvider._id)}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Provider Account
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  This action cannot be undone. All provider data will be
                  permanently removed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Management Table - Categorized Sections */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Service Providers
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage all service providers by category
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

        {/* Statistics Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active (Verified)</span>
                <span className="text-sm font-semibold text-green-600">
                  {totalActiveProviders}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="text-sm font-semibold text-red-600">
                  {totalRejectedProviders}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-semibold text-orange-600">
                  {totalPendingProviders}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Providers: {providers.length}
            </div>
          </div>
        </div>

        {/* Active Verified Providers Section */}
        {filteredVerified.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="px-6 py-3 bg-green-50">
              <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Active Providers (Verified) - {filteredVerified.length}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <ProviderTable
                providers={filteredVerified}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteProvider}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                showMemberSince={true}
              />
            </div>
          </div>
        )}

        {/* Rejected Providers Section */}
        {filteredRejected.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="px-6 py-3 bg-red-50">
              <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejected Providers - {filteredRejected.length}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <ProviderTable
                providers={filteredRejected}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteProvider}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                showMemberSince={false}
                isRejected={true}
              />
            </div>
          </div>
        )}

        {/* Pending Providers Section */}
        {filteredPending.length > 0 && (
          <div>
            <div className="px-6 py-3 bg-orange-50">
              <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Verification - {filteredPending.length}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <ProviderTable
                providers={filteredPending}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteProvider}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                showMemberSince={false}
                isPending={true}
              />
            </div>
          </div>
        )}

        {filteredVerified.length === 0 &&
          filteredRejected.length === 0 &&
          filteredPending.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              No providers found matching your search
            </div>
          )}
      </div>

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
    </>
  );
};

// Separate table component for cleaner code
const ProviderTable = ({
  providers,
  onViewDetails,
  onDelete,
  formatDate,
  getStatusColor,
  showMemberSince = true,
  isRejected = false,
  isPending = false,
}) => {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Provider
          </th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Contact
          </th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Service Category
          </th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Service Area
          </th>
          {showMemberSince && (
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
              Member Since
            </th>
          )}
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Status
          </th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {providers.map((provider) => {
          let status = "";
          let statusColor = "";

          if (
            isRejected ||
            (!provider.isVerified && provider.isActive === false)
          ) {
            status = "Rejected";
            statusColor = "bg-red-100 text-red-700 border-red-200";
          } else if (
            isPending ||
            (!provider.isVerified && provider.isActive !== false)
          ) {
            status = "Pending";
            statusColor = "bg-orange-100 text-orange-700 border-orange-200";
          } else {
            status = "Verified";
            statusColor = "bg-green-100 text-green-700 border-green-200";
          }

          return (
            <tr
              key={provider._id}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      provider.profileImage ||
                      `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=100`
                    }
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    alt={provider.firstName}
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {provider.firstName} {provider.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: {provider._id.slice(-8)}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm text-gray-600">{provider.email}</p>
                  <p className="text-xs text-gray-400">
                    {provider.phone || "No phone"}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  {provider.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  {provider.serviceArea || "Not specified"}
                </p>
              </td>
              {showMemberSince && (
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">
                    {formatDate(provider.createdAt)}
                  </p>
                </td>
              )}
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}
                >
                  {status === "Verified" && <CheckCircle className="w-3 h-3" />}
                  {status === "Rejected" && <XCircle className="w-3 h-3" />}
                  {status === "Pending" && <Clock className="w-3 h-3" />}
                  {status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetails(provider)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(provider._id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    title="Delete Provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ProviderManagement;
