const mongoose = require('mongoose');

const reportedReviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store user details directly to preserve them even if user is deleted
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  reviewText: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  reportReason: {
    type: String,
    required: true
  },
  reportDetails: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ReportedReview = mongoose.model('ReportedReview', reportedReviewSchema);

module.exports = ReportedReview;