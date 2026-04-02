// server/controllers/bookingController.js
const Booking = require("../models/Booking");
const User = require("../models/User");
const Provider = require("../models/Provider");

// Helper function for avatar URLs
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `http://localhost:5050${imagePath}`;
};

// Valid status transitions
const validTransitions = {
  pending: ["confirmed", "rejected"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceType,
      date,
      time,
      address,
      instructions,
      hourlyRate,
    } = req.body;

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Validate date (no past dates)
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book past dates",
      });
    }

    // Validate time for today
    if (bookingDate.toDateString() === today.toDateString()) {
      const [timeStr, period] = time.split(" ");
      let [hours, minutes] = timeStr.split(":");
      hours = parseInt(hours);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const bookingDateTime = new Date(bookingDate);
      bookingDateTime.setHours(hours, parseInt(minutes), 0, 0);

      if (bookingDateTime < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Cannot book past times for today",
        });
      }
    }

    const totalAmount = hourlyRate * 1;

    const booking = await Booking.create({
      user: {
        userId: user._id,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || "",
        address: address,
        avatar: user.avatar || "",
      },
      provider: {
        providerId: provider._id,
        name: `${provider.firstName} ${provider.lastName}`,
        category: provider.category,
        hourlyRate: hourlyRate,
        avatar: provider.profileImage || "",
      },
      service: serviceType,
      date: bookingDate,
      time: time,
      instructions: instructions || "",
      totalAmount: totalAmount,
      status: "pending",
    });

    // Format response with full image URLs
    const formattedBooking = {
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
      provider: {
        ...booking.provider,
        avatar: getFullImageUrl(booking.provider.avatar),
      },
    };

    res.status(201).json({
      success: true,
      message: "Booking request sent successfully!",
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get bookings for a user
const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;
    const bookings = await Booking.find({ "user.userId": userId }).sort({
      createdAt: -1,
    });

    const formattedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
      provider: {
        ...booking.provider,
        avatar: getFullImageUrl(booking.provider.avatar),
      },
    }));

    res.status(200).json({
      success: true,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get bookings for a provider (grouped by status)
const getProviderBookings = async (req, res) => {
  try {
    const providerId = req.providerId;
    const bookings = await Booking.find({
      "provider.providerId": providerId,
    }).sort({ createdAt: -1 });

    const formattedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
      provider: {
        ...booking.provider,
        avatar: getFullImageUrl(booking.provider.avatar),
      },
    }));

    const groupedBookings = {
      pending: formattedBookings.filter((b) => b.status === "pending"),
      confirmed: formattedBookings.filter((b) => b.status === "confirmed"),
      in_progress: formattedBookings.filter((b) => b.status === "in_progress"),
      completed: formattedBookings.filter((b) => b.status === "completed"),
      rejected: formattedBookings.filter((b) => b.status === "rejected"),
      cancelled: formattedBookings.filter((b) => b.status === "cancelled"),
    };

    res.status(200).json({
      success: true,
      bookings: groupedBookings,
    });
  } catch (error) {
    console.error("Get provider bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Start service
const startService = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const providerId = req.providerId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.provider.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Can only start confirmed bookings",
      });
    }

    booking.status = "in_progress";
    booking.startTime = new Date();
    await booking.save();

    const formattedBooking = {
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
    };

    res.status(200).json({
      success: true,
      message: "Service started successfully",
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("Start service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Complete service with duration and fare calculation
const completeService = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const providerId = req.providerId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.provider.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Can only complete in-progress bookings",
      });
    }

    booking.endTime = new Date();
    booking.status = "completed";

    // Calculate duration in hours with minute precision
    const durationMs = booking.endTime - booking.startTime;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Store exact duration for reference
    booking.duration = parseFloat(durationHours.toFixed(2));

    // Calculate fare based on hourly increments (ceiling to next hour)
    // If duration is 0.5 hours (30 mins) -> 1 hour
    // If duration is 1.2 hours (1 hr 12 mins) -> 2 hours
    // If duration is 2.7 hours (2 hr 42 mins) -> 3 hours
    const hoursToCharge = Math.ceil(durationHours);

    // Calculate fare based on provider's hourly rate
    booking.calculatedAmount = booking.provider.hourlyRate * hoursToCharge;

    await booking.save();

    const formattedBooking = {
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
      hoursCharged: hoursToCharge, // Include for response
      actualDuration: durationHours, // Include for response
    };

    res.status(200).json({
      success: true,
      message: "Service completed successfully",
      booking: formattedBooking,
      calculation: {
        actualDuration: `${durationHours.toFixed(2)} hours`,
        hoursCharged: hoursToCharge,
        hourlyRate: booking.provider.hourlyRate,
        totalAmount: booking.calculatedAmount,
      },
    });
  } catch (error) {
    console.error("Complete service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update booking status (for accept/reject)
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const providerId = req.providerId;

    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and status are required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.provider.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this booking",
      });
    }

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    const formattedBooking = {
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
      provider: {
        ...booking.provider,
        avatar: getFullImageUrl(booking.provider.avatar),
      },
    };

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add user review
const addUserReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to review this booking",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      });
    }

    if (booking.rating !== null && booking.rating !== undefined) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this booking",
      });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    const provider = await Provider.findById(booking.provider.providerId);
    const allCompletedBookings = await Booking.find({
      "provider.providerId": provider._id,
      status: "completed",
      rating: { $exists: true, $ne: null },
    });

    const totalRating = allCompletedBookings.reduce(
      (sum, b) => sum + (b.rating || 0),
      0,
    );
    provider.rating =
      allCompletedBookings.length > 0
        ? totalRating / allCompletedBookings.length
        : 0;
    provider.totalReviews = allCompletedBookings.length;
    await provider.save();

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get booking notifications
const getProviderNotifications = async (req, res) => {
  try {
    const providerId = req.providerId;
    const pendingBookings = await Booking.find({
      "provider.providerId": providerId,
      status: "pending",
    }).sort({ createdAt: -1 });

    const formattedPending = pendingBookings.map((booking) => ({
      ...booking.toObject(),
      user: {
        ...booking.user,
        avatar: getFullImageUrl(booking.user.avatar),
      },
    }));

    res.status(200).json({
      success: true,
      pending: formattedPending,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  startService,
  completeService,
  getProviderNotifications,
  addUserReview,
};
