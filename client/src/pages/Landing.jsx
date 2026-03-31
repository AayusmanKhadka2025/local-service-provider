import { Link } from "react-router-dom";
import {
  MapPin,
  Search,
  ShieldCheck,
  Zap,
  Home,
  Wrench,
  Zap as ElectricalIcon,
  Hammer,
  Paintbrush,
  Sparkles,
  Star,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
  Award,
  ThumbsUp,
  CalendarCheck,
} from "lucide-react";
import heroImage from "../assets/hero.jpg";
import sarahImage from "../assets/Sarah.jpg";
import michaelImage from "../assets/Michael.jpg";
import emilyImage from "../assets/Emily.jpg";

export default function Landing() {
  const services = [
    {
      name: "Plumbing",
      icon: Wrench,
      color: "blue",
      description: "Repairs & installations",
    },
    {
      name: "Electrical",
      icon: ElectricalIcon,
      color: "yellow",
      description: "Wiring & fixtures",
    },
    {
      name: "Carpentry",
      icon: Hammer,
      color: "orange",
      description: "Furniture & woodwork",
    },
    {
      name: "Painting",
      icon: Paintbrush,
      color: "green",
      description: "Interior & exterior",
    },
    {
      name: "Cleaning",
      icon: Sparkles,
      color: "purple",
      description: "Deep & regular cleaning",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Professionals",
      description:
        "All service providers are background-checked and verified for your safety and peace of mind.",
      color: "blue",
    },
    {
      icon: Clock,
      title: "Quick Response",
      description:
        "Get connected with available service providers in your area within minutes of booking.",
      color: "blue",
    },
    {
      icon: Award,
      title: "Quality Guaranteed",
      description:
        "We ensure high-quality service delivery with our satisfaction guarantee and review system.",
      color: "blue",
    },
  ];

  const testimonials = [
    {
      name: "Ritika Pokharel",
      role: "Homeowner, Kathmandu",
      image: sarahImage,
      rating: 5,
      text: "Amazing service! The plumber arrived on time, fixed my leaking pipes quickly, and the price was exactly as quoted. Highly recommend ServEase!",
    },
    {
      name: "Roshan Shrestha",
      role: "Business Owner, Bhaktapur",
      image: michaelImage,
      rating: 5,
      text: "I needed an electrician urgently and ServEase connected me with a verified professional within hours. Great platform with reliable service providers!",
    },
    {
      name: "Sunita Dangol",
      role: "Apartment Owner, Lalitpur",
      image: emilyImage,
      rating: 5,
      text: "The painter did an incredible job on my living room. The booking process was smooth and the customer support team was very helpful throughout.",
    },
  ];

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getServiceColor = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      yellow: "bg-yellow-100 text-yellow-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full bg-white">
      {/* ================= NAVBAR ================= */}
      <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ServEase
            </h1>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div>
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium mb-6 border border-blue-200">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Trusted by 10,000+ Happy Customers
            </span>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Find Trusted Local{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Service Providers
              </span>{" "}
              Near You
            </h2>

            {/* Features */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Zap className="w-4 h-4 text-blue-600" />
                Fast & Efficient
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Fully Verified
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <ThumbsUp className="w-4 h-4 text-blue-600" />
                100% Reliable
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 max-w-xl border border-gray-100">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {/* Location Input */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Your Location"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Service Type Input */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Service Type"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg">
                <Search className="w-4 h-4" />
                Find Service Providers
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                Book a Service
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/register">
                <button className="px-8 py-3.5 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all flex items-center gap-2">
                  Register as Provider
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative flex justify-center">
            <div className="bg-white p-4 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img
                src={heroImage}
                alt="Service Provider"
                className="rounded-xl w-full max-w-md object-cover"
              />
            </div>

            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2,500+</p>
                <p className="text-xs text-gray-500">Verified Providers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= POPULAR SERVICES ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Popular Services
          </h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
            Find the right professional for your home needs from our wide range
            of services
          </p>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 hover:border-transparent cursor-pointer"
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-xl ${getServiceColor(service.color)} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Why Choose ServEase?
          </h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
            Your trusted partner for all home service needs with unmatched
            benefits
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 hover:border-blue-100"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
            Real experiences from real people who trust ServEase for their home
            services
          </p>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100"
              >
                {renderStars(testimonial.rating)}

                <p className="text-gray-600 my-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-white">
            {/* LEFT CONTENT */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Are You a Skilled Service Provider?
              </h2>
              <p className="text-blue-100 mb-8 text-lg max-w-xl">
                Join thousands of professionals earning on ServEase. Grow your
                business and reach more customers today.
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  "Get verified and build trust with customers",
                  "Flexible working hours that suit your schedule",
                  "Competitive pricing with full control",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-400 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-blue-900" />
                    </div>
                    <span className="text-blue-50">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CTA */}
            <div className="flex flex-col items-start lg:items-end">
              <Link to="/register">
                <button className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-semibold flex items-center gap-3 hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl text-lg">
                  Register as a Service Provider
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <p className="text-sm text-blue-100 mt-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Free to join • No hidden fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
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
                    <Link
                      to="#"
                      className="hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-3 h-3 text-blue-400" />
                      {item}
                    </Link>
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
                    <Link
                      to="#"
                      className="hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-3 h-3 text-blue-400" />
                      {item}
                    </Link>
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
                  9812021764
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
