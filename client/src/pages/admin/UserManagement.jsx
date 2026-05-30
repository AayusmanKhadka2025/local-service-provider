// client/src/components/admin/UserManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  XCircle,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  AlertCircle,
  MapPin,
  Users,
  Home,
  Building2,
  Flag,
  Ban,
  Unlock,
  CheckCircle as CheckCircleIcon,
  AlertTriangle,
} from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [blocking, setBlocking] = useState(false);
  
  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmParams, setConfirmParams] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmType, setConfirmType] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Show confirmation dialog
  const showConfirmation = (title, message, action, params, type = "warning") => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmParams(params);
    setConfirmType(type);
    setShowConfirmModal(true);
  };

  // Execute confirmed action
  const executeConfirmedAction = async () => {
    if (confirmAction) {
      await confirmAction(confirmParams);
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmParams(null);
  };

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5050/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  // Block/Unblock User
  const handleBlockUnblockUser = async (userId, currentStatus) => {
    const action = currentStatus ? "unblock" : "block";
    const actionText = currentStatus ? "unblock" : "block";
    const actionVerb = currentStatus ? "unblocking" : "blocking";
    
    showConfirmation(
      `${currentStatus ? "Unblock" : "Block"} User`,
      `Are you sure you want to ${action} this user? ${currentStatus ? "They will be able to log in again." : "They will not be able to log in until unblocked."}`,
      async () => {
        setBlocking(true);
        try {
          const token = localStorage.getItem("adminToken");
          const endpoint = currentStatus 
            ? `http://localhost:5050/api/admin/users/${userId}/unblock`
            : `http://localhost:5050/api/admin/users/${userId}/block`;
          const response = await axios.put(endpoint, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            await fetchUsers();
            if (showUserModal && selectedUser?._id === userId) {
              setSelectedUser(prev => ({ ...prev, isBlocked: !currentStatus }));
            }
            showToast(`User ${actionText}ed successfully!`, "success");
          }
        } catch (error) {
          console.error(`Error ${actionVerb} user:`, error);
          showToast(`Failed to ${actionText} user`, "error");
        } finally {
          setBlocking(false);
        }
      },
      { userId, currentStatus },
      currentStatus ? "success" : "warning"
    );
  };

  const handleDeleteUser = async (userId) => {
    showConfirmation(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone. All user data will be permanently removed.",
      async () => {
        try {
          const token = localStorage.getItem("adminToken");
          const response = await axios.delete(
            `http://localhost:5050/api/admin/users/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            await fetchUsers();
            setShowUserModal(false);
            showToast("User deleted successfully!", "success");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          showToast("Failed to delete user", "error");
        }
      },
      { userId },
      "danger"
    );
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className={`bg-gradient-to-r ${
              confirmType === "danger" ? "from-red-600 to-red-500" :
              confirmType === "warning" ? "from-orange-600 to-orange-500" :
              confirmType === "success" ? "from-green-600 to-green-500" :
              "from-blue-600 to-blue-500"
            } p-6 text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{confirmTitle}</h3>
                  <p className="text-white/80 text-sm mt-1">Please confirm your action</p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className={`rounded-xl p-4 mb-6 ${
                confirmType === "danger" ? "bg-red-50 border border-red-200" :
                confirmType === "warning" ? "bg-orange-50 border border-orange-200" :
                "bg-yellow-50 border border-yellow-200"
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    confirmType === "danger" ? "text-red-600" :
                    confirmType === "warning" ? "text-orange-600" :
                    "text-yellow-600"
                  } mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Confirmation Required</p>
                    <p className="text-xs text-gray-600 mt-1">{confirmMessage}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    confirmType === "danger" ? "bg-red-600 text-white hover:bg-red-700" :
                    confirmType === "warning" ? "bg-orange-600 text-white hover:bg-orange-700" :
                    "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Confirm
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
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">User Details</h3>
                  <p className="text-blue-100 mt-1">Complete user information</p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.fullName}&background=3b82f6&color=fff&size=120`}
                  className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover"
                  alt={selectedUser.fullName}
                />
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</h4>
                  <p className="text-gray-500">User ID: {selectedUser._id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                      Active Member
                    </span>
                    {selectedUser.isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">
                        <Ban className="w-3 h-3" />
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="w-4 h-4 text-blue-600" />
                    Personal Information
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-800">{selectedUser.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium text-gray-800">{selectedUser.gender || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Member Since</p>
                        <p className="text-sm font-medium text-gray-800">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Contact Information
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email Address</p>
                        <p className="text-sm font-medium text-gray-800">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Phone Number</p>
                        <p className="text-sm font-medium text-gray-800">{selectedUser.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mt-6">
                <h5 className="font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Address Information
                </h5>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Flag className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Country</p>
                      <p className="text-sm font-medium text-gray-800">{selectedUser.country || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Province</p>
                      <p className="text-sm font-medium text-gray-800">{selectedUser.province || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">City</p>
                      <p className="text-sm font-medium text-gray-800">{selectedUser.city || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="text-sm font-medium text-gray-800">{selectedUser.area || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                
                {selectedUser.landmark && (
                  <div className="mt-3 flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Landmark</p>
                      <p className="text-sm font-medium text-gray-800">{selectedUser.landmark}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => handleBlockUnblockUser(selectedUser._id, selectedUser.isBlocked)}
                  disabled={blocking}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    selectedUser.isBlocked
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  } disabled:opacity-50`}
                >
                  {selectedUser.isBlocked ? (
                    <>
                      <Unlock className="w-5 h-5" />
                      Unblock User Account
                    </>
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Block User Account
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  {selectedUser.isBlocked 
                    ? "User will be able to log in and access their account after unblocking."
                    : "Blocked users cannot log in and will see a suspension message."}
                </p>

                <button
                  onClick={() => handleDeleteUser(selectedUser._id)}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete User Account (Permanent)
                </button>
                <p className="text-xs text-gray-500 text-center">
                  This action cannot be undone. All user data will be permanently removed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">All Users</h2>
              <p className="text-sm text-gray-500 mt-1">Manage and monitor all registered users</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Member Since</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}&background=3b82f6&color=fff&size=100`} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                        alt={user.fullName}
                      />
                      <div>
                        <p className="font-medium text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-400">ID: {user._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.phone || 'No phone'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-600">{user.city || 'Not specified'}</p>
                      <p className="text-xs text-gray-400">{user.country || ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <Ban className="w-3 h-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <CheckCircleIcon className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{formatDate(user.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(user)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleBlockUnblockUser(user._id, user.isBlocked)}
                        className={`p-2 rounded-lg transition ${
                          user.isBlocked 
                            ? "bg-green-50 text-green-600 hover:bg-green-100" 
                            : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        }`}
                        title={user.isBlocked ? "Unblock User" : "Block User"}
                      >
                        {user.isBlocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            Total Users: {users.length}
          </p>
        </div>
      </div>

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
    </>
  );
};

export default UserManagement;