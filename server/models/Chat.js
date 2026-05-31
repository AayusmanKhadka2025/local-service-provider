const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: {
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: String,
      avatar: String
    },
    provider: {
      providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
      },
      name: String,
      avatar: String
    }
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: String,
    enum: ['user', 'provider', null],
    default: null
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    default: ''
  },
  reportDetails: {
    type: String,
    default: ''
  },
  reportedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatSchema.index({ 'participants.user.userId': 1, 'participants.provider.providerId': 1 });
chatSchema.index({ bookingId: 1 });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;