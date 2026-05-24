const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middleware/adminAuth");
const {
  adminLogin,
  getDashboardStats,
  getAllProviders,
  getAllUsers,
  verifyProvider,
  rejectProvider,
  deleteUser,
  deleteProvider,
  deleteProviderReview,
} = require("../controllers/adminController");

// Public route
router.post("/login", adminLogin);

// Protected routes (require authentication)
router.use(protectAdmin);
router.get("/stats", getDashboardStats);
router.get("/providers", getAllProviders);
router.get("/users", getAllUsers);
router.put("/providers/:providerId/verify", protectAdmin, verifyProvider);
router.put("/providers/:providerId/reject", protectAdmin, rejectProvider);
router.delete("/users/:userId", deleteUser);

router.delete("/providers/:providerId", deleteProvider);
router.delete("/providers/:providerId/reviews/:reviewId", deleteProviderReview);

// Add at the top with other imports
const ReportedReview = require("../models/ReportedReview");
const Booking = require("../models/Booking");

// Add these routes after existing routes

// Get all reported reviews - FIXED to include complete user data
router.get("/reported-reviews", protectAdmin, async (req, res) => {
  try {
    const reports = await ReportedReview.find().sort({ createdAt: -1 });

    // Enrich with provider and additional user details
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const Provider = require("../models/Provider");
        const User = require("../models/User");

        // Get provider details
        const provider = await Provider.findById(report.providerId).select(
          "firstName lastName email category profileImage",
        );

        // Get fresh user details if available
        const user = await User.findById(report.userId).select(
          "fullName email avatar phone",
        );

        // Helper function for avatar URL
        const getFullImageUrl = (imagePath) => {
          if (!imagePath) return "";
          if (imagePath.startsWith("http")) return imagePath;
          return `http://localhost:5050${imagePath}`;
        };

        // Use stored user data if user not found, otherwise use fresh data
        const userName = user?.fullName || report.userName || "Unknown User";
        const userEmail = user?.email || report.userEmail || "No email";
        const userPhone = user?.phone || "No phone";

        return {
          _id: report._id,
          bookingId: report.bookingId,
          providerId: report.providerId,
          providerName: provider
            ? `${provider.firstName} ${provider.lastName}`
            : "Unknown Provider",
          providerEmail: provider?.email || "No email",
          providerCategory: provider?.category || "N/A",
          providerAvatar: getFullImageUrl(provider?.profileImage),
          userId: report.userId,
          userName: userName,
          userEmail: userEmail,
          userPhone: userPhone,
          userAvatar: getFullImageUrl(user?.avatar),
          reviewText: report.reviewText,
          rating: report.rating,
          reviewCreatedAt: report.createdAt,
          reportReason: report.reportReason,
          reportDetails: report.reportDetails,
          status: report.status,
          createdAt: report.createdAt,
        };
      }),
    );

    res.status(200).json({
      success: true,
      reports: enrichedReports,
    });
  } catch (error) {
    console.error("Get reported reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Update report status
router.put(
  "/reported-reviews/:reportId/status",
  protectAdmin,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { status } = req.body;

      const report = await ReportedReview.findByIdAndUpdate(
        reportId,
        { status },
        { new: true },
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Report ${status} successfully`,
      });
    } catch (error) {
      console.error("Update report status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
);

// Delete a review (admin action) - FIXED
router.delete("/reviews/:bookingId", protectAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Store providerId before updating
    const providerId = booking.provider.providerId;

    // Clear rating and review
    booking.rating = null;
    booking.review = "";
    await booking.save();

    // Update provider's average rating
    const Provider = require("../models/Provider");
    const provider = await Provider.findById(providerId);
    if (provider) {
      const allCompletedBookings = await Booking.find({
        "provider.providerId": providerId,
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
    }

    // Update related reports status
    await ReportedReview.updateMany(
      { bookingId: booking._id },
      { status: "action_taken" },
    );

    console.log(`Review deleted successfully for booking: ${bookingId}`);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
