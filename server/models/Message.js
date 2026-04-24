const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'provider']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverType'
  },
  receiverType: {
    type: String,
    required: true,
    enum: ['user', 'provider']
  },
  message: {
    type: String,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;