import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Info,
  Save,
  AlertTriangle,
  CheckCircle,
  Flag,
  Shield,
  Loader,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

// API Configuration
const API_BASE_URL = "http://localhost:5050/api";

export default function ProfileSettings({ onProfileUpdate }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    "https://i.pravatar.cc/150?img=12",
  );

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Delete reasons
  const deleteReasons = [
    { value: "not_satisfied", label: "Not satisfied with the service" },
    { value: "privacy_concerns", label: "Privacy concerns" },
    { value: "switching_platform", label: "Switching to another platform" },
    { value: "too_expensive", label: "Service too expensive" },
    { value: "technical_issues", label: "Technical issues with the platform" },
    { value: "no_longer_need", label: "No longer need the service" },
    { value: "other", label: "Other" },
  ];

  // User data state with default values
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
    country: "Nepal",
    province: "",
    city: "",
    area: "",
    landmark: "",
    avatar: "https://i.pravatar.cc/150?img=12",
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ========== FETCH LATEST PROFILE FROM SERVER ==========
  const fetchLatestProfile = async () => {
    if (!userData.email) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/profile/${userData.email}`
      );

      if (response.data.success) {
        const user = response.data.user;

        setUserData({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "",
          gender: user.gender || "Male",
          country: user.country || "Nepal",
          province: user.province || "",
          city: user.city || "",
          area: user.area || "",
          landmark: user.landmark || "",
          avatar: user.avatar || "https://i.pravatar.cc/150?img=12",
        });

        setImagePreview(user.avatar || "https://i.pravatar.cc/150?img=12");

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...currentUser,
          ...user,
          name: user.fullName,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // ========== LOAD USER DATA FROM LOCALSTORAGE ==========
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const avatarUrl =
            user.avatar ||
            `https://i.pravatar.cc/150?u=${user.email || "user"}`;

          setUserData({
            fullName: user.fullName || user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            gender: user.gender || "Male",
            country: user.country || "Nepal",
            province: user.province || "Bagmati Province",
            city: user.city || "Kathmandu",
            area: user.area || "Thamel",
            landmark: user.landmark || "Near Kathmandu Durbar Square",
            avatar: avatarUrl,
          });
          setImagePreview(avatarUrl);

          if (user.email) {
            await fetchLatestProfile();
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("email", userData.email);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        return `http://localhost:5050${response.data.avatarUrl}`;
      }
      return null;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      let avatarUrl = userData.avatar;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const updatedUserData = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        province: userData.province,
        city: userData.city,
        area: userData.area,
        landmark: userData.landmark,
        avatar: avatarUrl,
      };

      const response = await axios.put(
        `${API_BASE_URL}/users/profile`,
        updatedUserData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const updatedUserFromBackend = response.data.user;

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...currentUser,
          fullName: updatedUserFromBackend.fullName,
          name: updatedUserFromBackend.fullName,
          email: updatedUserFromBackend.email,
          phone: updatedUserFromBackend.phone,
          gender: updatedUserFromBackend.gender,
          province: updatedUserFromBackend.province,
          city: updatedUserFromBackend.city,
          area: updatedUserFromBackend.area,
          landmark: updatedUserFromBackend.landmark,
          avatar: updatedUserFromBackend.avatar,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));

        setUserData((prev) => ({
          ...prev,
          ...updatedUserFromBackend,
        }));

        if (updatedUserFromBackend.avatar) {
          setImagePreview(updatedUserFromBackend.avatar);
        }

        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }

        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });

        await fetchLatestProfile();

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to update profile. Please check if backend is running on port 5050.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await axios.put(
        `${API_BASE_URL}/users/change-password`,
        {
          email: userData.email,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Password updated successfully!",
        });

        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "Failed to update password",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Account Handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirm(false);
    setShowReasonModal(true);
  };

  const handleReasonSubmit = () => {
    if (!deleteReason) {
      setMessage({
        type: "error",
        text: "Please select a reason for deleting your account",
      });
      return;
    }
    setShowReasonModal(false);
    setShowFinalConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await axios.delete(
        "http://localhost:5050/api/account/user",
        {
          data: { userId: storedUser._id, reason: deleteReason },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("user_notifications");

        window.location.href = "/login?message=Account deleted successfully";
      }
    } catch (error) {
      console.error("Delete account error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete account. Please try again.",
      });
      setShowFinalConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative inline-block">
              <img
                src={
                  imagePreview ||
                  userData.avatar ||
                  "https://i.pravatar.cc/150?img=12"
                }
                alt="profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                onError={(e) => {
                  e.target.src = "https://i.pravatar.cc/150?img=12";
                }}
              />
              <label className="absolute bottom-2 right-2 bg-white p-2.5 rounded-full shadow-lg border border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer">
                <Camera className="w-4 h-4 text-blue-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-6 px-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {userData.fullName || "User"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{userData.email}</p>
        </div>
      </div>

      {/* PERSONAL INFORMATION SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Personal Information
              </h3>
            </div>

            <button
              onClick={handleSavePersonalInfo}
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Personal Info
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-gray-800"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <select
                name="gender"
                value={userData.gender}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Flag className="w-5 h-5 text-gray-400 mr-3" />
              <span className="flex items-center gap-2">
                <span className="text-2xl">🇳🇵</span>
                <span className="text-gray-800 font-medium">Nepal (Default)</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <select
                name="province"
                value={userData.province}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option>Bagmati Province</option>
                <option>Province No. 1</option>
                <option>Madhesh Province</option>
                <option>Gandaki Province</option>
                <option>Lumbini Province</option>
                <option>Karnali Province</option>
                <option>Sudurpashchim Province</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City / Municipality
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="city"
                  value={userData.city}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="e.g., Kathmandu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area / Ward
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="area"
                  value={userData.area}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="e.g., Thamel"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landmark{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                name="landmark"
                value={userData.landmark}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-gray-800"
                placeholder="e.g., Near Kathmandu Durbar Square"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Security Settings
              </h3>
            </div>

            <button
              onClick={handleSaveSecurity}
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
              <Lock className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full bg-transparent outline-none text-gray-800"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  type="button"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Password Requirements:
                </p>
                <ul className="text-sm text-blue-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span>Minimum 8 characters long</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span>At least one lowercase & uppercase character</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span>At least one number or symbol</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-red-600 font-semibold text-lg">Danger Zone</h4>
              <p className="text-sm text-red-500 mt-1 max-w-md">
                Once you delete your account, there is no going back. All your
                data, bookings, and reviews will be permanently removed.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 rounded-xl border-2 border-red-400 text-red-600 hover:bg-red-100 transition font-medium whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* First Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
              <h3 className="text-xl font-bold">Delete Account</h3>
              <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Are you sure?</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You are about to permanently delete your account. This will remove all your bookings, reviews, and personal information.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason Selection Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <h3 className="text-xl font-bold">Help us improve</h3>
              <p className="text-blue-100 text-sm mt-1">Please tell us why you're leaving</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {deleteReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.value}
                      checked={deleteReason === reason.value}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReasonModal(false);
                    setDeleteReason("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleReasonSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Modal */}
      {showFinalConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
              <h3 className="text-xl font-bold">Final Confirmation</h3>
              <p className="text-red-100 text-sm mt-1">This is your last chance</p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Warning!</p>
                    <p className="text-xs text-red-700 mt-1">
                      This action is irreversible. All your data will be permanently deleted from our servers.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                  disabled={deleting}
                >
                  No, Keep My Account
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}