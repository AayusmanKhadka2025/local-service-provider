const Booking = require("../models/Booking");
const User = require("../models/User");
const Provider = require("../models/Provider");

// Create a new booking
const createBooking = async (req, res) => {
  try {
    console.log("Booking creation request received:", req.body);
    console.log("User ID from token:", req.userId);

    const {
      providerId,
      serviceType,
      date,
      time,
      address,
      instructions,
      hourlyRate,
    } = req.body;

    // Validate required fields
    if (
      !providerId ||
      !serviceType ||
      !date ||
      !time ||
      !address ||
      !hourlyRate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get user from database
    const user = await User.findById(req.userId);
    if (!user) {
      console.log("User not found with ID:", req.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User found:", user.email);
    console.log("User phone:", user.phone);

    // Get provider from database
    const provider = await Provider.findById(providerId);
    if (!provider) {
      console.log("Provider not found with ID:", providerId);
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    console.log("Provider found:", provider.email);

    const totalAmount = hourlyRate * 1; // Assuming 1 hour minimum

    // Create booking with phone handling
    const booking = await Booking.create({
      user: {
        userId: user._id,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || "", // Use empty string if phone is null/undefined
        address: address,
      },
      provider: {
        providerId: provider._id,
        name: `${provider.firstName} ${provider.lastName}`,
        category: provider.category,
        hourlyRate: hourlyRate,
      },
      service: serviceType,
      date: new Date(date),
      time: time,
      instructions: instructions || "",
      totalAmount: totalAmount,
      status: "pending",
    });

    console.log("Booking created successfully:", booking._id);

    res.status(201).json({
      success: true,
      message: "Booking request sent successfully!",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
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

    res.status(200).json({
      success: true,
      bookings,
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

// Get bookings for a provider
const getProviderBookings = async (req, res) => {
  try {
    const providerId = req.providerId;
    const bookings = await Booking.find({
      "provider.providerId": providerId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
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

// Update booking status (Provider action)
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

    console.log("Token Provider ID:", providerId);
    console.log("Booking Provider ID:", booking.provider.providerId.toString());

    // Verify this booking belongs to the provider
    if (booking.provider.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this booking",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking,
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

// Get booking notifications for provider (pending bookings)
const getProviderNotifications = async (req, res) => {
  try {
    const providerId = req.providerId;
    const pendingBookings = await Booking.find({
      "provider.providerId": providerId,
      status: "pending",
    }).sort({ createdAt: -1 });

    const confirmedBookings = await Booking.find({
      "provider.providerId": providerId,
      status: "confirmed",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pending: pendingBookings,
      confirmed: confirmedBookings,
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
  getProviderNotifications,
};
