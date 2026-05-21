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
  ChevronRight,
  X,
  DollarSign,
  Tag,
  Image,
  Building2,
  Camera,
  Sparkles,
  Clock,
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

  const serviceTags = {
    Plumbing: [
      "Plumbing",
      "Repairs",
      "Installation",
      "Leak Detection",
      "Pipe Repair",
      "Water Heater",
    ],
    Electrical: [
      "Electrical",
      "Wiring",
      "Lighting",
      "Circuit Repair",
      "Fan Installation",
      "Security Lighting",
    ],
    Carpentry: [
      "Carpentry",
      "Furniture",
      "Renovation",
      "Cabinet Making",
      "Woodwork",
      "Door Repair",
    ],
    Painting: [
      "Painting",
      "Interior",
      "Exterior",
      "Wallpaper",
      "Texture Painting",
      "Color Consultation",
    ],
    Cleaning: [
      "Cleaning",
      "Deep Cleaning",
      "Eco-Friendly",
      "Housekeeping",
      "Carpet Cleaning",
      "Window Cleaning",
    ],
  };

  const toggleDay = (day) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImagePreview(reader.result);
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

  // Update the handleSubmit function in ProviderRegister.jsx:

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([k, v]) => formDataToSend.append(k, v));
    formDataToSend.append("availableDays", JSON.stringify(selectedDays));
    formDataToSend.append("serviceTags", JSON.stringify(selectedTags));
    if (profileImageFile)
      formDataToSend.append("profileImage", profileImageFile);
    if (governmentIdFile)
      formDataToSend.append("governmentId", governmentIdFile);
    if (portfolioFile) formDataToSend.append("portfolio", portfolioFile);

    try {
      // First, send OTP to verify email
      const otpResponse = await axios.post(
        "http://localhost:5050/api/providers/send-otp",
        {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          // Send all form data for storage
          ...formData,
          availableDays: selectedDays,
          serviceTags: selectedTags,
        },
      );

      if (otpResponse.data.success) {
        // Store email in localStorage for OTP verification
        localStorage.setItem("pendingProviderEmail", formData.email);

        // Store form data in sessionStorage for later use
        // Convert FormData to object for storage
        const formDataObj = {};
        for (let [key, value] of formDataToSend.entries()) {
          if (value instanceof File) {
            // Store file names temporarily (actual files will be re-uploaded)
            formDataObj[key] = {
              _isFile: true,
              name: value.name,
              type: value.type,
            };
          } else {
            formDataObj[key] = value;
          }
        }
        sessionStorage.setItem(
          "pendingProviderData",
          JSON.stringify(formDataObj),
        );
        sessionStorage.setItem(
          "pendingProviderDays",
          JSON.stringify(selectedDays),
        );
        sessionStorage.setItem(
          "pendingProviderTags",
          JSON.stringify(selectedTags),
        );

        // Navigate to OTP verification page with provider flag
        navigate("/verify-provider-otp", {
          state: {
            email: formData.email,
            userType: "provider",
          },
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.status === 409) {
        errorMessage =
          error.response.data.message ||
          "This email is already registered. Please use a different email.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessage({ type: "error", text: errorMessage });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getTagsForCategory = () =>
    formData.category && serviceTags[formData.category]
      ? serviceTags[formData.category]
      : [];

  const steps = [
    { icon: Camera, label: "Profile Photo" },
    { icon: User, label: "Personal Info" },
    { icon: Briefcase, label: "Service Details" },
    { icon: Shield, label: "Documents" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* ── NAVBAR ── */}
      <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-md transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12 px-4 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-5 border border-white/30">
            <Sparkles className="w-4 h-4" />
            Join 2,500+ Verified Professionals
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Register as a Service Provider
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
            Grow your business, reach more customers, and build lasting trust
            through Nepal's most reliable home-services platform.
          </p>

          {/* benefit pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            {[
              { icon: CheckCircle, text: "Free to join" },
              { icon: Shield, text: "Verified badge" },
              { icon: Clock, text: "Flexible schedule" },
              { icon: Star, text: "Build reviews" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1"
              >
                <Icon className="w-3.5 h-3.5" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ── */}
      <div className="max-w-3xl mx-auto px-4 -mt-5 mb-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4 flex items-center justify-between">
          {steps.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[10px] text-gray-500 font-medium hidden sm:block text-center leading-tight">
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-gray-200 mx-2 mt-[-10px]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── TOAST ── */}
      {message.text && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full shadow-2xl">
          <div
            className={`rounded-xl p-4 flex items-start gap-3 border ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium flex-1 ${
                message.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {message.text}
            </p>
            <button onClick={() => setMessage({ type: "", text: "" })}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* ── FORM CARD ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {/* ═══ SECTION 0: Profile Photo ═══ */}
            <Section
              icon={Camera}
              title="Profile Photo"
              subtitle="Add a professional photo so customers recognise you"
              step="01"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-blue-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-2">
                      <Camera className="w-8 h-8 text-blue-300" />
                      <span className="text-[10px] text-blue-400 font-medium">
                        No photo
                      </span>
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center cursor-pointer shadow-md hover:from-blue-700 hover:to-blue-600 transition-all">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Upload your photo
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    PNG, JPG or WEBP — max 5 MB. Optional but recommended.
                  </p>
                  <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 text-xs font-medium rounded-xl border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    {profileImagePreview ? "Change Photo" : "Choose Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </Section>

            {/* ═══ SECTION 1: Personal Information ═══ */}
            <Section
              icon={User}
              title="Personal Information"
              subtitle="Your basic contact details"
              step="02"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput
                  icon={User}
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                  disabled={loading}
                />
                <FormInput
                  icon={User}
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                  disabled={loading}
                />
                <FormInput
                  icon={Phone}
                  name="phone"
                  placeholder="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  disabled={loading}
                />
                <FormInput
                  icon={Mail}
                  name="email"
                  placeholder="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  disabled={loading}
                />
                <FormPassword
                  name="password"
                  placeholder="Create Password"
                  show={showPassword}
                  setShow={setShowPassword}
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  disabled={loading}
                />
                <FormPassword
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={errors.confirmPassword}
                  disabled={loading}
                />
              </div>

              {formData.password && (
                <PasswordStrength password={formData.password} />
              )}
            </Section>

            {/* ═══ SECTION 2: Service Information ═══ */}
            <Section
              icon={Briefcase}
              title="Service Details"
              subtitle="Tell customers what you do and how they can reach you"
              step="03"
            >
              {/* Category & Experience */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect
                  icon={Briefcase}
                  name="category"
                  placeholder="Service Category"
                  options={serviceCategories}
                  value={formData.category}
                  onChange={handleInputChange}
                  error={errors.category}
                  disabled={loading}
                />
                <FormSelect
                  icon={Star}
                  name="experience"
                  placeholder="Experience Level"
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
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4 text-blue-500" />
                    Service Tags
                    <span className="text-xs text-gray-400 font-normal">
                      — select all that apply
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getTagsForCategory().map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={loading}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedTags.includes(tag)
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {errors.tags && <ErrorMsg text={errors.tags} />}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Service Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe your services, specialties, and what makes you stand out..."
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none focus:ring-2 focus:bg-white ${
                    errors.description
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-200 focus:ring-blue-300 focus:border-blue-400"
                  }`}
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.description && <ErrorMsg text={errors.description} />}
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput
                  icon={MapPin}
                  name="address"
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  disabled={loading}
                />
                <FormInput
                  icon={Building2}
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={errors.city}
                  disabled={loading}
                />
                <FormInput
                  icon={DollarSign}
                  name="hourlyRate"
                  placeholder="Hourly Rate (NPR)"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  error={errors.hourlyRate}
                  disabled={loading}
                />
                <FormInput
                  icon={MapPin}
                  name="serviceArea"
                  placeholder="Service Area (e.g. Thamel, Patan)"
                  value={formData.serviceArea}
                  onChange={handleInputChange}
                  error={errors.serviceArea}
                  disabled={loading}
                />
              </div>

              {/* Available Days */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Available Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={loading}
                      className={`w-14 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        selectedDays.includes(day)
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.days && <ErrorMsg text={errors.days} />}
              </div>
            </Section>

            {/* ═══ SECTION 3: Documents ═══ */}
            <Section
              icon={Shield}
              title="Verification Documents"
              subtitle="We verify all providers to keep our community safe"
              step="04"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <UploadBox
                  icon={FileText}
                  title="Government ID"
                  subtitle="JPG, PNG, or PDF — max 5 MB"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFileSelect={setGovernmentIdFile}
                  error={errors.governmentId}
                  disabled={loading}
                />
                <UploadBox
                  icon={Folder}
                  title="Portfolio / Past Work"
                  subtitle="ZIP, PDF or images — max 15 MB"
                  accept=".jpg,.jpeg,.png,.pdf,.zip"
                  onFileSelect={setPortfolioFile}
                  error={errors.portfolio}
                  disabled={loading}
                />
              </div>

              {/* Trust note */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-0.5">
                    Why do we need this?
                  </p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Documents are securely stored and used solely for identity
                    verification. Once approved, you'll receive a verified badge
                    on your profile.
                  </p>
                </div>
              </div>
            </Section>

            {/* ═══ SUBMIT ═══ */}
            <div className="px-6 md:px-10 py-8 bg-gray-50">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-base hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Registering your account…
                  </>
                ) : (
                  <>
                    Register as Provider
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Wrapper ─── */
function Section({ icon: Icon, title, subtitle, step, children }) {
  return (
    <div className="px-6 md:px-10 py-8 space-y-5">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-md">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {step}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {/* Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ─── Text Input ─── */
function FormInput({
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
        className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 transition-all focus-within:bg-white ${
          error
            ? "border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-gray-200 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Icon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
        />
      </div>
      {error && <ErrorMsg text={error} />}
    </div>
  );
}

/* ─── Password Input ─── */
function FormPassword({
  name,
  placeholder,
  show,
  setShow,
  value,
  onChange,
  error,
  disabled,
}) {
  return (
    <div>
      <div
        className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 transition-all focus-within:bg-white ${
          error
            ? "border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-gray-200 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Lock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          disabled={disabled}
          className="ml-2 flex-shrink-0"
        >
          {show ? (
            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      {error && <ErrorMsg text={error} />}
    </div>
  );
}

/* ─── Select Input ─── */
function FormSelect({
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
        className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 transition-all focus-within:bg-white ${
          error
            ? "border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-gray-200 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Icon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm text-gray-800 appearance-none cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90 flex-shrink-0 ml-2" />
      </div>
      {error && <ErrorMsg text={error} />}
    </div>
  );
}

/* ─── Password Strength ─── */
function PasswordStrength({ password }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", ok: /[a-z]/.test(password) },
    { label: "Number (0-9)", ok: /[0-9]/.test(password) },
    {
      label: "Special character (!@#…)",
      ok: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor =
    score <= 2
      ? "bg-red-400"
      : score <= 3
        ? "bg-yellow-400"
        : score === 4
          ? "bg-blue-400"
          : "bg-green-500";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      {/* bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Password strength</span>
          <span className="font-medium">
            {["", "Weak", "Weak", "Fair", "Good", "Strong"][score]}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>
      {/* checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-1.5">
            <CheckCircle
              className={`w-3.5 h-3.5 ${ok ? "text-green-500" : "text-gray-300"}`}
            />
            <span
              className={`text-[11px] ${ok ? "text-green-700" : "text-gray-400"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Upload Box ─── */
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

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div>
      <label
        htmlFor={`upload-${title}`}
        className={`block border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : fileName
              ? "border-green-400 bg-green-50"
              : error
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          id={`upload-${title}`}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              fileName
                ? "bg-green-100"
                : error
                  ? "bg-red-100"
                  : "bg-white border border-gray-200 shadow-sm"
            }`}
          >
            <Icon
              className={`w-6 h-6 ${
                fileName
                  ? "text-green-600"
                  : error
                    ? "text-red-500"
                    : "text-blue-400"
              }`}
            />
          </div>
          {fileName ? (
            <>
              <p className="text-xs font-semibold text-green-700 break-all px-2">
                {fileName}
              </p>
              <p className="text-[10px] text-green-500">Click to replace</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700">{title}</p>
              <p className="text-xs text-gray-400">{subtitle}</p>
              <span className="text-[11px] font-medium text-blue-500 border border-blue-200 bg-blue-50 rounded-lg px-3 py-1 mt-1">
                Browse or drag & drop
              </span>
            </>
          )}
        </div>
      </label>
      {error && <ErrorMsg text={error} />}
    </div>
  );
}

/* ─── Error Message ─── */
function ErrorMsg({ text }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {text}
    </p>
  );
}
