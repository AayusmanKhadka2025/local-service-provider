import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Folder,
  Briefcase,
  Calendar,
  CheckCircle,
  AlertCircle,
  Home,
  FileText,
  Star,
  ArrowRight,
  Shield,
  MapPin,
  Clock,
  ChevronRight,
  X,
  DollarSign,
  Tag,
  Image,
  Building2,
  Camera,
} from "lucide-react";

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [governmentIdFile, setGovernmentIdFile] = useState(null);
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    category: "",
    experience: "",
    description: "",
    address: "",
    city: "",
    hourlyRate: "",
    serviceArea: "",
  });
  const [errors, setErrors] = useState({});

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const serviceCategories = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
  ];

  const experienceLevels = [
    "1-2 Years",
    "3-5 Years",
    "5-10 Years",
    "10+ Years",
    "Expert (15+ Years)",
  ];

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

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.category)
      newErrors.category = "Please select a service category";
    if (!formData.experience)
      newErrors.experience = "Please select your experience level";
    if (!formData.description)
      newErrors.description = "Please describe your services";
    if (selectedDays.length === 0)
      newErrors.days = "Please select at least one available day";
    if (selectedTags.length === 0)
      newErrors.tags = "Please select at least one service tag";
    if (!formData.address) newErrors.address = "Service address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.hourlyRate) newErrors.hourlyRate = "Hourly rate is required";
    else if (isNaN(formData.hourlyRate) || formData.hourlyRate <= 0)
      newErrors.hourlyRate = "Please enter a valid hourly rate";
    if (!governmentIdFile) newErrors.governmentId = "Government ID is required";
    if (!portfolioFile) newErrors.portfolio = "Portfolio file is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("confirmPassword", formData.confirmPassword);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("experience", formData.experience);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("availableDays", JSON.stringify(selectedDays));
    formDataToSend.append("serviceTags", JSON.stringify(selectedTags));
    formDataToSend.append("address", formData.address);
    formDataToSend.append("city", formData.city);
    formDataToSend.append("hourlyRate", formData.hourlyRate);
    formDataToSend.append("serviceArea", formData.serviceArea);

    // Append files
    if (profileImageFile) {
      formDataToSend.append("profileImage", profileImageFile);
    }
    if (governmentIdFile) {
      formDataToSend.append("governmentId", governmentIdFile);
    }
    if (portfolioFile) {
      formDataToSend.append("portfolio", portfolioFile);
    }

    try {
      const response = await axios.post(
        "http://localhost:5050/api/providers/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Registration successful! You can now login with your credentials.",
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
          category: "",
          experience: "",
          description: "",
          address: "",
          city: "",
          hourlyRate: "",
          serviceArea: "",
        });
        setSelectedDays([]);
        setSelectedTags([]);
        setGovernmentIdFile(null);
        setPortfolioFile(null);
        setProfileImageFile(null);
        setProfileImagePreview(null);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage =
            "An account with this email already exists. Please use a different email.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });

      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: "", text: "" });
  };

  // Get tags for selected category
  const getTagsForCategory = () => {
    if (formData.category && serviceTags[formData.category]) {
      return serviceTags[formData.category];
    }
    return [];
  };

  return (
    <div className="min-h-screen py-10 px-10 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto">
        

        {/* Success/Error Message Modal */}
        {message.text && (
          <div className={`fixed top-5 right-5 z-50 animate-slide-in`}>
            <div
              className={`rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {message.text}
                </p>
              </div>
              <button
                onClick={clearMessage}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Register as a Service Provider
              </h1>
              <p className="text-gray-500 mt-2 text-sm max-w-2xl mx-auto">
                Join our network of trusted professionals and start growing your
                business today.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 0: Profile Image */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Image className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-800 text-lg">
                    Profile Image
                  </h2>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Upload a profile picture (optional)
                </p>
              </div>

              {/* SECTION 1: Personal Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-800 text-lg">
                    Personal Information
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    icon={User}
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    disabled={loading}
                  />
                  <Input
                    icon={User}
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    disabled={loading}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    icon={Phone}
                    name="phone"
                    placeholder="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    disabled={loading}
                  />
                  <Input
                    icon={Mail}
                    name="email"
                    placeholder="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    disabled={loading}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <PasswordField
                    name="password"
                    placeholder="Password"
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    disabled={loading}
                  />
                  <PasswordField
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={errors.confirmPassword}
                    disabled={loading}
                  />
                </div>

                {formData.password && !loading && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Password Requirements:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle
                          className={`w-3 h-3 ${formData.password.length >= 8 ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span>Minimum 8 characters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-gray-400" />
                        <span>At least one uppercase & lowercase letter</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-gray-400" />
                        <span>At least one number or symbol</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* SECTION 2: Service Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-800 text-lg">
                    Service Information
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <SelectField
                    icon={Briefcase}
                    name="category"
                    placeholder="Select a category"
                    options={serviceCategories}
                    value={formData.category}
                    onChange={handleInputChange}
                    error={errors.category}
                    disabled={loading}
                  />
                  <SelectField
                    icon={Star}
                    name="experience"
                    placeholder="Select experience level"
                    options={experienceLevels}
                    value={formData.experience}
                    onChange={handleInputChange}
                    error={errors.experience}
                    disabled={loading}
                  />
                </div>

                {/* Service Tags */}
                {formData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Service Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getTagsForCategory().map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            selectedTags.includes(tag)
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {errors.tags && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.tags}
                      </p>
                    )}
                  </div>
                )}

                {/* Service Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Service Description
                  </label>
                  <textarea
                    name="description"
                    rows="6"
                    placeholder="Briefly describe the services you offer, your specialties, and what makes you stand out..."
                    className={`w-full bg-gray-50 border rounded-xl px-5 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y text-sm ${
                      errors.description
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.description}
                    </p>
                  )}
                </div>

                {/* Location Information */}
                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    icon={MapPin}
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    error={errors.address}
                    disabled={loading}
                  />
                  <Input
                    icon={Building2}
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={errors.city}
                    disabled={loading}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    icon={DollarSign}
                    name="hourlyRate"
                    placeholder="Hourly Rate (e.g., 50)"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    error={errors.hourlyRate}
                    disabled={loading}
                  />
                  <Input
                    icon={MapPin}
                    name="serviceArea"
                    placeholder="Service Area (e.g., Downtown, Uptown)"
                    value={formData.serviceArea}
                    onChange={handleInputChange}
                    error={errors.serviceArea}
                    disabled={loading}
                  />
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
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedDays.includes(day)
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors.days && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.days}
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 3: Verification Documents */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-800 text-lg">
                    Verification Documents
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <UploadBox
                    icon={FileText}
                    title="Government ID"
                    subtitle="SVG, PNG, JPG or PDF (max. 5MB)"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onFileSelect={setGovernmentIdFile}
                    error={errors.governmentId}
                    disabled={loading}
                  />
                  <UploadBox
                    icon={Folder}
                    title="Portfolio / Past Work"
                    subtitle="ZIP, PDF or images (max. 15MB)"
                    accept=".jpg,.jpeg,.png,.pdf,.zip"
                    onFileSelect={setPortfolioFile}
                    error={errors.portfolio}
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Why we need these documents?
                      </p>
                      <p className="text-xs text-blue-600">
                        We verify all service providers to ensure trust and
                        safety for our customers. Your documents are securely
                        stored and only used for verification purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Registering...
                    </>
                  ) : (
                    <>
                      Register as Provider
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:text-blue-700 transition"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ================= INPUT COMPONENT ================= */
function Input({
  icon: Icon,
  placeholder,
  name,
  value,
  onChange,
  error,
  type = "text",
  disabled,
}) {
  return (
    <div>
      <div
        className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 focus-within:ring-2 transition-all ${
          error
            ? "border-red-500 focus-within:ring-red-500"
            : "border-gray-200 focus-within:ring-blue-500"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Icon className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ================= PASSWORD COMPONENT ================= */
function PasswordField({
  name,
  placeholder,
  showPassword,
  setShowPassword,
  value,
  onChange,
  error,
  disabled,
}) {
  return (
    <div>
      <div
        className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 focus-within:ring-2 transition-all ${
          error
            ? "border-red-500 focus-within:ring-red-500"
            : "border-gray-200 focus-within:ring-blue-500"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Lock className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ================= SELECT COMPONENT ================= */
function SelectField({
  icon: Icon,
  name,
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled,
}) {
  return (
    <div>
      <div
        className={`relative flex items-center bg-gray-50 border rounded-xl px-4 py-3 focus-within:ring-2 transition-all ${
          error
            ? "border-red-500 focus-within:ring-red-500"
            : "border-gray-200 focus-within:ring-blue-500"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Icon className="w-5 h-5 text-gray-400 mr-3" />
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm appearance-none cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ================= UPLOAD BOX COMPONENT ================= */
function UploadBox({
  icon: Icon,
  title,
  subtitle,
  accept,
  onFileSelect,
  error,
  disabled,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : fileName
              ? "border-green-500 bg-green-50"
              : error
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-blue-400 bg-gray-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          className="hidden"
          disabled={disabled}
          id={`upload-${title}`}
        />
        <label
          htmlFor={`upload-${title}`}
          className={`cursor-pointer block ${disabled ? "cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                fileName ? "bg-green-100" : error ? "bg-red-100" : "bg-gray-200"
              }`}
            >
              <Icon
                className={`w-7 h-7 ${fileName ? "text-green-600" : error ? "text-red-500" : "text-gray-500"}`}
              />
            </div>
            {fileName ? (
              <>
                <p className="text-sm font-medium text-green-700">{fileName}</p>
                <p className="text-xs text-green-600">Click to change file</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 font-medium">{title}</p>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </>
            )}
          </div>
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
