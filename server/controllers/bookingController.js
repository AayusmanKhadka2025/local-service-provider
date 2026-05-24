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

// Helper function to check provider availability on a specific date
const isProviderAvailableOnDate = (provider, date) => {
  if (!provider?.availableDays || provider.availableDays.length === 0) {
    return false;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDayName = dayNames[date.getDay()];

  return provider.availableDays.includes(selectedDayName);
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
      phoneNumber,
      emergencyContact,
    } = req.body;

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's phone number if provided and different
    if (phoneNumber && user.phone !== phoneNumber) {
      user.phone = phoneNumber;
      await user.save();
    }

    // Update emergency contact if provided
    if (emergencyContact && user.emergencyContact !== emergencyContact) {
      user.emergencyContact = emergencyContact;
      await user.save();
    }

    // Fetch provider first
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Check if provider is verified
    if (!provider.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Cannot book with unverified provider",
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

    // Check provider availability on selected date
    if (!isProviderAvailableOnDate(provider, bookingDate)) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const selectedDayName = dayNames[bookingDate.getDay()];
      const availableDaysFormatted =
        provider.availableDays
          ?.map((d) => {
            const fullDays = {
              Sun: "Sunday",
              Mon: "Monday",
              Tue: "Tuesday",
              Wed: "Wednesday",
              Thu: "Thursday",
              Fri: "Friday",
              Sat: "Saturday",
            };
            return fullDays[d] || d;
          })
          .join(", ") || "Not specified";

      return res.status(400).json({
        success: false,
        message: `Provider is not available on ${selectedDayName}. Available days: ${availableDaysFormatted}`,
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
        phone: phoneNumber || user.phone || "",
        emergencyContact: emergencyContact || user.emergencyContact || "",
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

    // Check payment status for each booking
    const Payment = require("../models/Payment");
    const bookingsWithPaymentStatus = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({
          bookingId: booking._id,
          status: "success",
        });

        return {
          ...booking.toObject(),
          paymentCompleted: !!payment,
          paymentDetails: payment
            ? {
                amount: payment.amount,
                completedAt: payment.completedAt,
                transactionUuid: payment.transactionUuid,
              }
            : null,
        };
      }),
    );

    const formattedBookings = bookingsWithPaymentStatus.map((booking) => ({
      ...booking,
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
      hoursCharged: hoursToCharge,
      actualDuration: durationHours,
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

// Cancel booking (User action - only for pending bookings)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
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
        message: "Unauthorized to cancel this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be cancelled",
      });
    }

    booking.status = "cancelled";
    booking.updatedAt = new Date();
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
      message: "Booking cancelled successfully",
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all reviews for a provider
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Booking.find({
      "provider.providerId": providerId,
      status: "completed",
      rating: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .select("user.name user.email rating review createdAt");

    const formattedReviews = reviews.map((review) => ({
      userName: review.user.name,
      userEmail: review.user.email,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
    }));

    res.status(200).json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Get provider reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add this function after addUserReview function

// Edit existing user review
const editUserReview = async (req, res) => {
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
        message: "Unauthorized to edit this review",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only edit reviews for completed bookings",
      });
    }

    if (booking.rating === null || booking.rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "No review exists for this booking",
      });
    }

    // Update the review
    booking.rating = rating;
    booking.review = review || "";
    await booking.save();

    // Recalculate provider's average rating
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
    await provider.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Edit review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Report a review (for providers)
const reportReview = async (req, res) => {
  try {
    const { bookingId, reason, details } = req.body;
    const providerId = req.providerId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify this booking belongs to the provider
    if (booking.provider.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to report this review",
      });
    }

    // Check if there's already a review to report
    if (!booking.rating || booking.rating === null) {
      return res.status(400).json({
        success: false,
        message: "No review exists for this booking",
      });
    }

    // Check if already reported
    const ReportedReview = require("../models/ReportedReview");
    const existingReport = await ReportedReview.findOne({
      bookingId: booking._id,
      providerId: providerId,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this review",
      });
    }

    // IMPORTANT: Get the user details from the booking
    const user = await User.findById(booking.user.userId);

    // Create report with complete user information
    const report = await ReportedReview.create({
      bookingId: booking._id,
      providerId: providerId,
      userId: booking.user.userId,
      userName: user?.fullName || booking.user.name || "Unknown User",
      userEmail: user?.email || booking.user.email || "No email",
      reviewText: booking.review || "",
      rating: booking.rating,
      reportReason: reason,
      reportDetails: details || "",
      status: "pending",
    });

    console.log(
      `Review reported successfully: Booking ${bookingId}, User: ${report.userName}, Provider: ${providerId}`,
    );

    res.status(201).json({
      success: true,
      message: "Review reported successfully. Admin will review the report.",
    });
  } catch (error) {
    console.error("Report review error:", error);
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
  reportReview,
  updateBookingStatus,
  startService,
  completeService,
  cancelBooking,
  getProviderNotifications,
  addUserReview,
  getProviderReviews,
  editUserReview,
};
