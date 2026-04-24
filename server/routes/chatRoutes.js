const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

// Configure multer for chat media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Helper function to find or create chat
const findOrCreateChat = async (userId, providerId, userName, providerName, providerAvatar) => {
  let chat = await Chat.findOne({
    'participants.user.userId': userId,
    'participants.provider.providerId': providerId
  });
  
  if (!chat) {
    chat = await Chat.create({
      participants: {
        user: {
          userId: userId,
          name: userName,
          avatar: ''
        },
        provider: {
          providerId: providerId,
          name: providerName,
          avatar: providerAvatar || ''
        }
      },
      bookingId: null,
      lastMessage: '',
      lastMessageTime: new Date()
    });
  }
  
  return chat;
};

// Get or create chat
router.post('/get-or-create', protectUser, async (req, res) => {
  try {
    const { providerId, providerName, providerAvatar } = req.body;
    const userId = req.userId;
    const user = req.user;

    const chat = await findOrCreateChat(
      userId, 
      providerId, 
      user.fullName, 
      providerName, 
      providerAvatar
    );
    
    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get chat list for user
router.get('/user/chats', protectUser, async (req, res) => {
  try {
    const userId = req.userId;
    const chats = await Chat.find({ 'participants.user.userId': userId })
      .sort({ lastMessageTime: -1 });
    
    const chatsWithLastMessage = await Promise.all(chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chatId: chat._id.toString() })
        .sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        chatId: chat._id.toString(),
        receiverId: userId,
        read: false
      });
      
      return {
        ...chat.toObject(),
        lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : (lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video')) : 'No messages yet',
        lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
        unreadCount
      };
    }));
    
    res.status(200).json({
      success: true,
      chats: chatsWithLastMessage
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get chat list for provider
router.get('/provider/chats', protectProvider, async (req, res) => {
  try {
    const providerId = req.providerId;
    const chats = await Chat.find({ 'participants.provider.providerId': providerId })
      .sort({ lastMessageTime: -1 });
    
    const chatsWithLastMessage = await Promise.all(chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chatId: chat._id.toString() })
        .sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        chatId: chat._id.toString(),
        receiverId: providerId,
        read: false
      });
      
      return {
        ...chat.toObject(),
        lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : (lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video')) : 'No messages yet',
        lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
        unreadCount
      };
    }));
    
    res.status(200).json({
      success: true,
      chats: chatsWithLastMessage
    });
  } catch (error) {
    console.error('Get provider chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get messages for a chat (User)
router.get('/messages/:chatId', protectUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat || chat.participants.user.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this chat'
      });
    }
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 });
    
    await Message.updateMany(
      { chatId, receiverId: req.userId, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get messages for a chat (Provider)
router.get('/provider/messages/:chatId', protectProvider, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat || chat.participants.provider.providerId.toString() !== req.providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this chat'
      });
    }
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 });
    
    await Message.updateMany(
      { chatId, receiverId: req.providerId, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Save message (called from socket)
const saveMessage = async (messageData) => {
  try {
    const { chatId, senderId, senderType, receiverId, receiverType, message, messageType, mediaUrl, senderName, providerName, providerAvatar, userName } = messageData;
    
    let finalChatId = chatId;
    
    if (!chatId || chatId === 'temp') {
      let chat;
      if (senderType === 'user') {
        chat = await findOrCreateChat(
          senderId, 
          receiverId, 
          senderName, 
          providerName, 
          providerAvatar
        );
      } else {
        chat = await findOrCreateChat(
          receiverId, 
          senderId, 
          userName, 
          providerName, 
          providerAvatar
        );
      }
      finalChatId = chat._id.toString();
    }
    
    const newMessage = await Message.create({
      chatId: finalChatId,
      senderId,
      senderType,
      receiverId,
      receiverType,
      message,
      messageType,
      mediaUrl: mediaUrl || '',
      read: false,
      createdAt: new Date()
    });
    
    await Chat.findByIdAndUpdate(finalChatId, {
      lastMessage: messageType === 'text' ? message : (messageType === 'image' ? '📷 Image' : '🎥 Video'),
      lastMessageTime: new Date(),
      updatedAt: new Date()
    });
    
    return { success: true, message: newMessage, chatId: finalChatId };
  } catch (error) {
    console.error('Save message error:', error);
    return { success: false, error: error.message };
  }
};

// Upload media file - User
router.post('/upload', protectUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `http://localhost:5050/uploads/chat/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      fileUrl,
      fileType
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Upload media file - Provider
router.post('/provider/upload', protectProvider, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `http://localhost:5050/uploads/chat/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      fileUrl,
      fileType
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Export both router and saveMessage
module.exports = { router, saveMessage };