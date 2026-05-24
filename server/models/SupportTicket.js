const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['user', 'provider'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminReplies: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: String,
    message: String,
    attachments: [{
      fileName: String,
      filePath: String,
      fileType: String,
      uploadedAt: Date
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

supportTicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;