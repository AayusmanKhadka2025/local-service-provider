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
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  Star,
  Clock,
  Award,
  Edit2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

// API Configuration
const API_BASE_URL = "http://localhost:5050/api";

export default function ProviderSetting({ onProfileUpdate }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Delete reasons for providers
  const deleteReasons = [
    { value: "not_satisfied", label: "Not satisfied with the platform" },
    { value: "low_demand", label: "Not enough booking requests" },
    { value: "switching_platform", label: "Switching to another platform" },
    { value: "pricing_issues", label: "Commission or pricing concerns" },
    { value: "technical_issues", label: "Technical issues with the platform" },
    { value: "moving_business", label: "Moving my business elsewhere" },
    { value: "other", label: "Other" },
  ];

  // Provider data state
  const [providerData, setProviderData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "",
    experience: "",
    description: "",
    address: "",
    city: "",
    hourlyRate: "",
    serviceArea: "",
    rating: 0,
    totalReviews: 0,
    avatar: "",
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Available days
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Service Tags based on category
  const serviceTags = {
    Plumbing: [
      "plumbing",
      "repairs",
      "installation",
      "leak detection",
      "pipe repair",
      "water heater",
    ],
    Electrical: [
      "electrical",
      "wiring",
      "lighting",
      "circuit repair",
      "fan installation",
      "security lighting",
    ],
    Carpentry: [
      "carpentry",
      "furniture",
      "renovation",
      "cabinet making",
      "woodwork",
      "door repair",
    ],
    Painting: [
      "painting",
      "interior",
      "exterior",
      "wallpaper",
      "texture painting",
      "color consultation",
    ],
    Cleaning: [
      "cleaning",
      "deep cleaning",
      "eco-friendly",
      "housekeeping",
      "carpet cleaning",
      "window cleaning",
    ],
  };

  const experienceLevels = [
    "1-2 Years",
    "3-5 Years",
    "5-10 Years",
    "10+ Years",
    "Expert (15+ Years)",
  ];

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads/"))
      return `http://localhost:5050${imagePath}`;
    return imagePath;
  };

  // ========== FETCH LATEST PROVIDER PROFILE FROM SERVER ==========
  const fetchLatestProfile = async () => {
    const storedProvider = localStorage.getItem("provider");
    if (!storedProvider) return;

    try {
      const provider = JSON.parse(storedProvider);
      const token = localStorage.getItem("providerToken");

      const response = await axios.get(
        `http://localhost:5050/api/providers/profile/${encodeURIComponent(provider.email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const data = response.data.provider;

        setProviderData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          category: data.category || "",
          experience: data.experience || "",
          description: data.description || "",
          address: data.address || "",
          city: data.city || "",
          hourlyRate: data.hourlyRate || "",
          serviceArea: data.serviceArea || "",
          rating: data.rating || 0,
          totalReviews: data.totalReviews || 0,
          avatar:
            getFullImageUrl(data.profileImage) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || "Provider")}&background=3b82f6&color=fff&size=100`,
        });

        setImagePreview(
          getFullImageUrl(data.profileImage) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || "Provider")}&background=3b82f6&color=fff&size=100`
        );
        setSelectedDays(data.availableDays || []);
        setSelectedTags(data.serviceTags || []);

        const updatedProvider = {
          ...provider,
          ...data,
          profileImage: data.profileImage,
          availableDays: data.availableDays,
          serviceTags: data.serviceTags,
        };
        localStorage.setItem("provider", JSON.stringify(updatedProvider));

        if (onProfileUpdate) {
          onProfileUpdate(updatedProvider);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // ========== LOAD PROVIDER DATA FROM LOCALSTORAGE ==========
  useEffect(() => {
    const loadProviderData = async () => {
      const storedProvider = localStorage.getItem("provider");
      if (storedProvider) {
        try {
          const provider = JSON.parse(storedProvider);
          const avatarUrl =
            getFullImageUrl(provider.profileImage) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.firstName || "Provider")}&background=3b82f6&color=fff&size=100`;

          setProviderData({
            firstName: provider.firstName || "",
            lastName: provider.lastName || "",
            email: provider.email || "",
            phone: provider.phone || "",
            category: provider.category || "",
            experience: provider.experience || "",
            description: provider.description || "",
            address: provider.address || "",
            city: provider.city || "",
            hourlyRate: provider.hourlyRate || "",
            serviceArea: provider.serviceArea || "",
            rating: provider.rating || 0,
            totalReviews: provider.totalReviews || 0,
            avatar: avatarUrl,
          });

          setImagePreview(avatarUrl);
          setSelectedDays(provider.availableDays || []);
          setSelectedTags(provider.serviceTags || []);

          await fetchLatestProfile();
        } catch (error) {
          console.error("Error parsing provider data:", error);
        }
      }
    };

    loadProviderData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProviderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
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

  // Toggle available days
  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Toggle service tags
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Get available tags based on category
  const getAvailableTags = () => {
    if (providerData.category && serviceTags[providerData.category]) {
      return serviceTags[providerData.category];
    }
    return [];
  };

  // Upload image to server
  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("profileImage", imageFile);
    formData.append("email", providerData.email);

    try {
      const token = localStorage.getItem("providerToken");
      const response = await axios.post(
        `${API_BASE_URL}/providers/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return getFullImageUrl(response.data.avatarUrl);
      }
      return null;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // Save Profile Information
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      let avatarUrl = providerData.avatar;
      if (imageFile) {
        const formData = new FormData();
        formData.append("profileImage", imageFile);

        const token = localStorage.getItem("providerToken");
        const uploadResponse = await axios.post(
          "http://localhost:5050/api/providers/upload-avatar",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (uploadResponse.data.success) {
          avatarUrl = uploadResponse.data.avatarUrl;
        }
      }

      const updatedProviderData = {
        firstName: providerData.firstName,
        lastName: providerData.lastName,
        phone: providerData.phone,
        experience: providerData.experience,
        description: providerData.description,
        address: providerData.address,
        city: providerData.city,
        hourlyRate: providerData.hourlyRate,
        serviceArea: providerData.serviceArea,
        availableDays: selectedDays,
        serviceTags: selectedTags,
        profileImage: avatarUrl,
      };

      const token = localStorage.getItem("providerToken");
      const response = await axios.put(
        "http://localhost:5050/api/providers/profile",
        updatedProviderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const updatedProvider = response.data.provider;

        const currentProvider = JSON.parse(
          localStorage.getItem("provider") || "{}"
        );
        const updated = {
          ...currentProvider,
          ...updatedProvider,
          profileImage: updatedProvider.profileImage,
          availableDays: selectedDays,
          serviceTags: selectedTags,
        };
        localStorage.setItem("provider", JSON.stringify(updated));

        setProviderData((prev) => ({
          ...prev,
          ...updatedProvider,
          avatar: getFullImageUrl(updatedProvider.profileImage) || prev.avatar,
        }));

        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });

        if (onProfileUpdate) {
          onProfileUpdate(updated);
        }

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save Security Settings
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

      const token = localStorage.getItem("providerToken");
      const response = await axios.put(
        "http://localhost:5050/api/providers/change-password",
        {
          email: providerData.email,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
      const token = localStorage.getItem("providerToken");
      const storedProvider = JSON.parse(localStorage.getItem("provider") || "{}");

      const response = await axios.delete(
        "http://localhost:5050/api/account/provider",
        {
          data: { providerId: storedProvider._id, reason: deleteReason },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("provider");
        localStorage.removeItem("providerToken");
        localStorage.removeItem("userType");
        localStorage.removeItem("provider_notifications");

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
      </div>
    );
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
                  providerData.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(providerData.firstName || "Provider")}&background=3b82f6&color=fff&size=100`
                }
                alt="profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(providerData.firstName || "Provider")}&background=3b82f6&color=fff&size=100`;
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {providerData.firstName} {providerData.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(providerData.rating)}
                <span className="text-sm text-gray-500">
                  ({providerData.totalReviews} reviews)
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Service Category</p>
              <p className="text-lg font-semibold text-blue-600">
                {providerData.category}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{providerData.email}</p>
        </div>
      </div>

      {/* PROFILE INFORMATION SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Profile Information
              </h3>
            </div>

            <button
              onClick={handleSaveProfile}
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="firstName"
                  value={providerData.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="First name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="lastName"
                  value={providerData.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
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
                  value={providerData.email}
                  className="w-full bg-transparent outline-none text-gray-500 cursor-not-allowed"
                  readOnly
                  disabled
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
                  value={providerData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Service Category (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Category
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                value={providerData.category}
                className="w-full bg-transparent outline-none text-gray-500 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Service category cannot be changed</p>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <div className="relative">
              <Award className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <select
                name="experience"
                value={providerData.experience}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">Select experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hourly Rate & Service Area */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (Rs.)
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="number"
                  name="hourlyRate"
                  value={providerData.hourlyRate}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Area
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="serviceArea"
                  value={providerData.serviceArea}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="e.g., Downtown, Uptown"
                />
              </div>
            </div>
          </div>

          {/* Address & City */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="address"
                  value={providerData.address}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="city"
                  value={providerData.city}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-800"
                  placeholder="City"
                />
              </div>
            </div>
          </div>

          {/* Available Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Available Days
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedDays.includes(day)
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Service Tags */}
          {providerData.category && getAvailableTags().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Service Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {getAvailableTags().map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* About Me / Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Me / Service Description
            </label>
            <textarea
              name="description"
              rows="5"
              value={providerData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white"
              placeholder="Describe your services, experience, and what makes you unique..."
            />
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
          {/* Current Password */}
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

          {/* New Password and Confirm Password */}
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

          {/* Password Requirements */}
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
                Once you delete your account, there is no going back. All your data, bookings, and reviews will be permanently removed.
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
                      You are about to permanently delete your provider account. This will remove all your bookings, reviews, and profile information.
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