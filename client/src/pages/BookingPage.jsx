import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Bell,
  Star,
  MapPin,
  Briefcase,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Shield,
  Clock,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  ChevronRight as ChevronRightIcon,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Calendar,
  User,
  Award,
  MessageSquare,
  X,
  Edit2,
  DollarSign,
  Tag,
  ArrowLeft,
  AlertCircle,
  Check,
} from "lucide-react";

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [provider, setProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("11:30 AM");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceAddress, setServiceAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [dateError, setDateError] = useState("");
  const [user, setUser] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const mainContentRef = useRef(null);
  const footerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const times = ["09:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        let avatarUrl = userData.avatar;
        if (avatarUrl && avatarUrl.startsWith("/uploads/")) {
          avatarUrl = `http://localhost:5050${avatarUrl}`;
        } else if (!avatarUrl) {
          avatarUrl = `https://i.pravatar.cc/100?u=${userData.email || "user"}`;
        }
        setUser({
          ...userData,
          avatar: avatarUrl,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Load provider data from navigation state
  useEffect(() => {
    if (location.state?.provider) {
      setProvider(location.state.provider);
      console.log("Provider data received:", location.state.provider);
    } else {
      navigate("/service-listing");
    }
  }, [location, navigate]);

  // Smooth scroll to top on page load
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if a time is in the past for the selected date
  const isPastTime = (time, date) => {
    const today = new Date();
    const selectedDateTime = new Date(date);
    const [timeStr, period] = time.split(" ");
    let [hours, minutes] = timeStr.split(":");
    hours = parseInt(hours);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    selectedDateTime.setHours(hours, parseInt(minutes), 0, 0);
    return selectedDateTime < today;
  };

  // Validate date and time
  const validateDateTime = (date, time) => {
    if (isPastDate(date)) {
      setDateError("Cannot book past dates. Please select a future date.");
      return false;
    }

    const today = new Date();
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly.getTime() === todayDateOnly.getTime() && time) {
      if (isPastTime(time, date)) {
        setDateError(
          "Cannot book past times. Please select a future time.",
        );
        return false;
      }
    }
    setDateError("");
    return true;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateSelect = (date) => {
    if (isPastDate(date)) {
      setDateError("Cannot select past dates. Please choose a future date.");
      return;
    }
    setSelectedDate(date);
    setManualDate(formatDateForInput(date));
    setShowManualInput(false);
    setDateError("");
  };

  const handleManualDateChange = (e) => {
    setManualDate(e.target.value);
    const [year, month, day] = e.target.value.split("-");
    if (year && month && day) {
      const newDate = new Date(year, month - 1, day);
      if (isPastDate(newDate)) {
        setDateError("Cannot select past dates. Please choose a future date.");
      } else {
        setSelectedDate(newDate);
        setDateError("");
      }
    }
  };

  const handleManualTimeChange = (e) => {
    const newTime = e.target.value;
    const [hours, minutes] = newTime.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${period}`;
    setManualTime(newTime);
    setSelectedTime(formattedTime);

    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      if (isPastTime(formattedTime, selectedDate)) {
        setDateError(
          "Cannot book past times for today. Please select a future time.",
        );
      } else {
        setDateError("");
      }
    }
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    if (!isPastDate(newDate)) {
      setSelectedDate(newDate);
      setManualDate(formatDateForInput(newDate));
      setDateError("");
    } else {
      setDateError("Cannot navigate to past weeks.");
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
    setManualDate(formatDateForInput(newDate));
    setDateError("");
  };

  const handleBooking = async () => {
    if (!serviceAddress) {
      setDateError("Please enter your service address");
      return;
    }

    if (!selectedTime) {
      setDateError("Please select a time for your booking");
      return;
    }

    if (!validateDateTime(selectedDate, selectedTime)) {
      return;
    }

    setBookingSuccess(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5050/api/bookings/create",
        {
          providerId: provider._id,
          serviceType: provider.category,
          date: selectedDate,
          time: selectedTime,
          address: serviceAddress,
          instructions: specialInstructions,
          hourlyRate: provider.hourlyRate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Booking error:", error);
      setDateError(
        error.response?.data?.message ||
          "Failed to create booking. Please try again.",
      );
      setBookingSuccess(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getProviderImage = () => {
    if (provider.profileImage && provider.profileImage !== "") {
      return provider.profileImage;
    }
    return `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=150`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className="w-4 h-4 text-gray-300" />
                <Star
                  className="w-4 h-4 fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </div>
            );
          } else {
            return <Star key={i} className="w-4 h-4 text-gray-300" />;
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transform transition-all animate-scaleIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-4">
              Your booking request has been sent successfully!
              <br />
              The provider will confirm shortly.
            </p>
            <div className="animate-pulse">
              <p className="text-sm text-blue-600">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Back Button and Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/service-listing")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                ServEase
              </h1>
            </div>
          </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-105">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                2
              </span>
            </button>
            <Link to="/dashboard">
              <img
                src={user?.avatar || "https://i.pravatar.cc/100?u=user"}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-md"
                alt="Profile"
                onError={(e) => {
                  e.target.src = "https://i.pravatar.cc/100?u=user";
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div ref={mainContentRef} className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT - Provider Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* PROFILE CARD */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-xl">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex gap-5">
                <img
                  src={getProviderImage()}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-md transition-transform duration-300 hover:scale-105"
                  alt={provider.firstName}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=150`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-800">
                      {provider.firstName} {provider.lastName}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full animate-fadeIn">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <p className="text-blue-600 text-sm font-medium mt-1">
                    {provider.category} Specialist
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {renderStars(provider.rating || 0)}
                      <span className="ml-1">{provider.rating || 0}</span>
                      <span className="text-gray-400">
                        ({provider.totalReviews || 0} reviews)
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />{" "}
                      {provider.city || "Location not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />{" "}
                      {provider.experience || "Experience not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> $
                      {provider.hourlyRate || 0}/hr
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> About Me
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {provider.description ||
                    "Professional service provider with years of experience in the industry."}
                </p>
                {provider.serviceTags && provider.serviceTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {provider.serviceTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full transition-all duration-300 hover:bg-blue-100 hover:scale-105 cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Client
                  Reviews
                </h3>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Sarah Jenkins
                      </h4>
                      <p className="text-xs text-gray-400">Oct 12, 2023</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(5)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Excellent service! {provider.firstName} was professional,
                    punctual, and did an amazing job.
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">David Chen</h4>
                      <p className="text-xs text-gray-400">Sep 28, 2023</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(5)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Very professional and knowledgeable. Will definitely hire
                    again!
                  </p>
                </div>
              </div>
            </div>

            {/* OVERVIEW / GUARANTEES */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: Shield,
                    title: "Service Guarantee",
                    desc: "30-day guarantee on all work",
                  },
                  {
                    icon: Clock,
                    title: "Punctuality",
                    desc: "Always on-time arrival",
                  },
                  {
                    icon: CheckCircle,
                    title: "Clean Workspace",
                    desc: "Leaves no mess behind",
                  },
                  {
                    icon: Award,
                    title: "Licensed & Insured",
                    desc: "Fully certified professional",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 hover:scale-105 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT - Booking Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Service Rate</p>
                  <h2 className="text-3xl font-bold text-gray-800">
                    ${provider.hourlyRate || 85}
                    <span className="text-sm font-normal text-gray-500">
                      /hour
                    </span>
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-600 px-3 py-1.5 rounded-full animate-pulse">
                  <CheckCircle className="w-3 h-3" /> Available Today
                </span>
              </div>

              {dateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-red-600">{dateError}</p>
                </div>
              )}

              {/* Toggle between Calendar and Manual Input */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowManualInput(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${!showManualInput ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" /> Calendar
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${showManualInput ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Edit2 className="w-4 h-4 inline mr-2" /> Manual Entry
                </button>
              </div>

              {/* Calendar View with Default Time Slots */}
              {!showManualInput && (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {currentMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map(({ date, isCurrentMonth }, index) => {
                        const isSelectedDate = isSelected(date);
                        const isTodayDate = isToday(date);
                        const isPast = isPastDate(date);
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(date)}
                            disabled={!isCurrentMonth || isPast}
                            className={`h-10 rounded-lg text-sm font-medium transition-all duration-300 ${!isCurrentMonth ? "text-gray-300 cursor-not-allowed opacity-50" : ""} ${isPast ? "text-gray-300 cursor-not-allowed opacity-50" : "cursor-pointer"} ${isSelectedDate ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md scale-105" : ""} ${isTodayDate && !isSelectedDate && !isPast ? "border-2 border-blue-300 bg-blue-50 text-blue-600" : ""} ${!isSelectedDate && isCurrentMonth && !isPast ? "hover:bg-gray-100 hover:scale-105 text-gray-700" : ""}`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={handlePrevWeek}
                        className="flex-1 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        ← Previous Week
                      </button>
                      <button
                        onClick={handleNextWeek}
                        className="flex-1 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Next Week →
                      </button>
                    </div>
                  </div>

                  {/* Default Time Slots - Only in Calendar View */}
                  <div className="mb-6">
                    <p className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Select Time
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {times.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTime === time ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md scale-105" : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Manual Input View - Only manual date and time */}
              {showManualInput && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Select Date
                    </label>
                    <input
                      type="date"
                      value={manualDate || formatDateForInput(selectedDate)}
                      onChange={handleManualDateChange}
                      min={formatDateForInput(new Date())}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Selected: {formatDisplayDate(selectedDate)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Select Time
                    </p>
                    <input
                      type="time"
                      value={manualTime}
                      onChange={handleManualTimeChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {selectedTime && (
                      <p className="text-xs text-green-600 mt-2">
                        Selected time: {selectedTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ADDRESS */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Service Address
                </label>
                <input
                  type="text"
                  placeholder="Enter your full address"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* NOTES */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Special Instructions
                  (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Any specific details about the service..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingSuccess}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingSuccess ? "Processing..." : "Book Now →"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                You won't be charged yet. Payment will be collected after
                service completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        ref={footerRef}
        className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 mt-12"
      >
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">ServEase</h3>
              </div>
              <p className="text-sm leading-relaxed max-w-xs text-gray-400">
                Your trusted platform for finding reliable local service
                providers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">About</h4>
              <ul className="space-y-3 text-sm">
                {["About Us", "How It Works", "Careers", "Blog"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">
                Policies
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  "Privacy Policy",
                  "Terms of Service",
                  "Refund Policy",
                  "Cookie Policy",
                ].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3 hover:text-white transition">
                  <Mail className="w-4 h-4 text-blue-400" />{" "}
                  serveease2082@gmail.com
                </li>
                <li className="flex items-center gap-3 hover:text-white transition">
                  <Phone className="w-4 h-4 text-blue-400" /> 9812021764
                </li>
                <li className="flex items-center gap-3 hover:text-white transition">
                  <MapPinIcon className="w-4 h-4 text-blue-400" /> San
                  Basantapur, Kathmandu
                </li>
              </ul>
              <div className="flex gap-3 mt-8">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={index}
                      className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 hover:scale-110 transition group"
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2024 ServEase. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">
              Made with ❤️ for better service experiences
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
