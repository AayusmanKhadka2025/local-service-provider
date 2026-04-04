import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Filter,
  SlidersHorizontal,
  X,
  Briefcase,
  Clock,
  CheckCircle,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Phone,
  MapPin as MapPinIcon,
  ChevronRight as ChevronRightIcon,
  DollarSign,
  User,
  Camera,
} from "lucide-react";

export default function ServiceListing() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRating, setSelectedRating] = useState("Any");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [user, setUser] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Fetch providers from backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5050/api/providers/all",
        );
        if (response.data.success) {
          console.log("Fetched providers:", response.data.providers); // Debug log
          setProviders(response.data.providers);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();

    // Get current user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const categories = [
    "All",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
  ];
  const ratings = ["Any", "4.5", "4.0"];

  const toggleFavorite = (id) => {
    setFavoriteServices((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    );
  };

  const handleImageError = (providerId) => {
    setImageErrors((prev) => ({
      ...prev,
      [providerId]: true,
    }));
  };

  const getProviderImage = (provider) => {
    // If image error occurred, use fallback
    if (imageErrors[provider._id]) {
      return `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=100`;
    }

    // If profile image exists, use it
    if (provider.profileImage && provider.profileImage !== "") {
      return provider.profileImage;
    }

    // Generate avatar from name
    return `https://ui-avatars.com/api/?name=${provider.firstName}+${provider.lastName}&background=3b82f6&color=fff&size=100`;
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesCategory =
      selectedCategory === "All" || provider.category === selectedCategory;
    const matchesRating =
      selectedRating === "Any" || provider.rating >= parseFloat(selectedRating);
    const matchesPrice =
      (!priceMin || provider.hourlyRate >= parseInt(priceMin)) &&
      (!priceMax || provider.hourlyRate <= parseInt(priceMax));
    const matchesSearch =
      !searchQuery ||
      provider.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.serviceTags &&
        provider.serviceTags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    return matchesCategory && matchesRating && matchesPrice && matchesSearch;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (sortBy === "price-low") return a.hourlyRate - b.hourlyRate;
    if (sortBy === "price-high") return b.hourlyRate - a.hourlyRate;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

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

  const handleViewDetails = (provider) => {
    navigate(`/provider-details/${provider._id}`, { state: { provider } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </h1>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* User Profile */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <img
                src={user?.avatar || "https://i.pravatar.cc/100?u=user"}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 shadow-sm cursor-pointer hover:scale-105 transition"
              />
            </Link>

            {/* Mobile Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-blue-50 py-20 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Professional services for your{" "}
            <span className="text-blue-600">perfect home.</span>
          </h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            Book trusted local pros for plumbing, electrical, painting, and
            more. Verified background checks and 24/7 support.
          </p>

          {/* Search Bar */}
          <div className="bg-white shadow-lg rounded-2xl flex items-center overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center flex-1 px-4">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="What service do you need?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-4 outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-medium transition">
              Search
            </button>
          </div>

          {/* Popular Tags */}
          <p className="text-sm text-gray-400 mt-6">
            Popular:{" "}
            <span className="text-blue-600 cursor-pointer">
              Emergency Plumbing
            </span>
            , <span className="text-blue-600 cursor-pointer">AC Repair</span>,{" "}
            <span className="text-blue-600 cursor-pointer">House Cleaning</span>
            ,{" "}
            <span className="text-blue-600 cursor-pointer">Wall Painting</span>
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* SIDEBAR - FILTERS */}
          <aside
            className={`${showFilters ? "block" : "hidden"} md:block fixed md:relative inset-0 md:inset-auto z-30 md:z-auto bg-white md:bg-transparent p-6 md:p-0 md:bg-white/90 md:backdrop-blur-sm md:rounded-xl md:border md:border-gray-100 md:shadow-lg h-full md:h-auto overflow-y-auto`}
          >
            {showFilters && (
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800 text-lg">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedRating("Any");
                    setPriceMin("");
                    setPriceMax("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Service Categories
                </h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Rating
                </h4>
                <div className="space-y-2">
                  {ratings.map((rate) => (
                    <label
                      key={rate}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={selectedRating === rate}
                        onChange={() => setSelectedRating(rate)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">
                        {rate === "Any" ? "Any Rating" : `${rate}+ stars`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Hourly Rate
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* LISTING SECTION */}
          <div className="md:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {filteredProviders.length} Professionals found
                </h3>
                <p className="text-sm text-gray-500">
                  Showing trusted service providers in your area
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Provider Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProviders.map((provider) => (
                <div
                  key={provider._id}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img
                          src={getProviderImage(provider)}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                          alt={`${provider.firstName} ${provider.lastName}`}
                          onError={() => handleImageError(provider._id)}
                        />
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {provider.firstName} {provider.lastName}
                          </h4>
                          <p className="text-xs text-blue-600">
                            {provider.category}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(provider._id)}
                        className="hover:bg-gray-100 p-1 rounded-full transition"
                      >
                        <Heart
                          className={`w-5 h-5 transition ${
                            favoriteServices.includes(provider._id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 hover:text-red-500"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-3">
                      {renderStars(provider.rating || 0)}
                      <span className="text-sm font-medium text-gray-800">
                        {provider.rating || 0}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({provider.totalReviews || 0} reviews)
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {provider.description ||
                        "Professional service provider with years of experience in the industry."}
                    </p>

                    {/* Tags */}
                    {provider.serviceTags &&
                      provider.serviceTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {provider.serviceTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Location & Experience */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {provider.city || "Location not specified"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {provider.experience || "Experience not specified"}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Hourly Rate</p>
                        <p className="text-lg font-bold text-gray-800">
                          Rs. {provider.hourlyRate || 0}
                          <span className="text-sm font-normal text-gray-500">
                            /hr
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewDetails(provider)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-md"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredProviders.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No professionals found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Top Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">ServEase</h3>
              </div>
              <p className="text-sm leading-relaxed max-w-xs text-gray-400">
                Your trusted platform for finding reliable local service
                providers. Quality services, verified professionals, transparent
                pricing.
              </p>
            </div>

            {/* About */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">About</h4>
              <ul className="space-y-3 text-sm">
                {["About Us", "How It Works", "Careers", "Blog"].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
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
                    <button className="hover:text-white transition-colors flex items-center gap-2">
                      <ChevronRightIcon className="w-3 h-3 text-blue-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-blue-400" />
                  serveease2082@gmail.com
                </li>
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-blue-400" />
                  +977 9812021764
                </li>
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                  <MapPinIcon className="w-4 h-4 text-blue-400" />
                  Basantapur, Kathmandu
                </li>
              </ul>

              {/* Social Icons */}
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
                      className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors group"
                      aria-label={social.label}
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Divider */}
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
