const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Booking = require('../models/Booking');

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

// CRITICAL FIX: Find or create chat - ONLY ONE per user-provider pair
const findOrCreateChat = async (userId, providerId, userName, providerName, providerAvatar) => {
  // ALWAYS try to find existing chat by user-provider pair first
  let chat = await Chat.findOne({
    'participants.user.userId': userId,
    'participants.provider.providerId': providerId
  });
  
  // If no chat exists, create one
  if (!chat) {
    console.log(`Creating new chat for user ${userId} and provider ${providerId}`);
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
      bookingId: null, // Not tied to a specific booking
      lastMessage: '',
      lastMessageTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    console.log(`Found existing chat ${chat._id} for user ${userId} and provider ${providerId}`);
  }
  
  return chat;
};

// Get or create chat - ALWAYS use user-provider pair, NOT booking-specific
router.post('/get-or-create', protectUser, async (req, res) => {
  try {
    const { providerId, providerName, providerAvatar } = req.body;
    const userId = req.userId;
    const user = req.user;
    
    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID is required'
      });
    }
    
    console.log('Get or create chat request:', { userId, providerId });
    
    // CRITICAL: Always use user-provider pair, ignore bookingId
    const chat = await findOrCreateChat(
      userId, 
      providerId, 
      user.fullName || user.name, 
      providerName, 
      providerAvatar
    );
    
    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        participants: chat.participants,
        bookingId: chat.bookingId,
        createdAt: chat.createdAt
      }
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

// Get chat list for user - DEDUPLICATED (ensure unique provider per chat)
router.get('/user/chats', protectUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find all chats where this user is participant
    const chats = await Chat.find({ 'participants.user.userId': userId })
      .sort({ lastMessageTime: -1 });
    
    // Deduplicate by provider ID (in case of duplicate entries)
    const uniqueChats = [];
    const providerIds = new Set();
    
    for (const chat of chats) {
      const providerId = chat.participants.provider.providerId.toString();
      if (!providerIds.has(providerId)) {
        providerIds.add(providerId);
        
        const lastMessage = await Message.findOne({ chatId: chat._id.toString() })
          .sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          chatId: chat._id.toString(),
          receiverId: userId,
          read: false
        });
        
        uniqueChats.push({
          _id: chat._id,
          participants: chat.participants,
          bookingId: chat.bookingId,
          lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : (lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
          unreadCount,
          createdAt: chat.createdAt
        });
      }
    }
    
    res.status(200).json({
      success: true,
      chats: uniqueChats
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

// Get chat list for provider - DEDUPLICATED
router.get('/provider/chats', protectProvider, async (req, res) => {
  try {
    const providerId = req.providerId;
    
    const chats = await Chat.find({ 'participants.provider.providerId': providerId })
      .sort({ lastMessageTime: -1 });
    
    // Deduplicate by user ID
    const uniqueChats = [];
    const userIds = new Set();
    
    for (const chat of chats) {
      const userId = chat.participants.user.userId.toString();
      if (!userIds.has(userId)) {
        userIds.add(userId);
        
        const lastMessage = await Message.findOne({ chatId: chat._id.toString() })
          .sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          chatId: chat._id.toString(),
          receiverId: providerId,
          read: false
        });
        
        uniqueChats.push({
          _id: chat._id,
          participants: chat.participants,
          bookingId: chat.bookingId,
          lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : (lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
          unreadCount,
          createdAt: chat.createdAt
        });
      }
    }
    
    res.status(200).json({
      success: true,
      chats: uniqueChats
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
    
    const messages = await Message.find({ chatId: chatId.toString() })
      .sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { chatId: chatId.toString(), receiverId: req.userId, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      messages: messages
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
    
    const messages = await Message.find({ chatId: chatId.toString() })
      .sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { chatId: chatId.toString(), receiverId: req.providerId, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      messages: messages
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
    let chat = null;
    
    // If no valid chatId, find or create chat based on user-provider pair
    if (!chatId || chatId === 'temp' || chatId === 'null' || chatId === 'undefined') {
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
      console.log('Created/found chat for message:', finalChatId);
    } else {
      // Verify chat exists
      chat = await Chat.findById(chatId);
      if (!chat) {
        console.error('Chat not found:', chatId);
        return { success: false, error: 'Chat not found' };
      }
      finalChatId = chatId;
    }
    
    // Create message
    const newMessage = await Message.create({
      chatId: finalChatId,
      senderId,
      senderType,
      receiverId,
      receiverType,
      message: message || '',
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || '',
      read: false,
      createdAt: new Date()
    });
    
    // Update chat's last message
    await Chat.findByIdAndUpdate(finalChatId, {
      lastMessage: messageType === 'text' ? (message || 'Media message') : (messageType === 'image' ? '📷 Image' : '🎥 Video'),
      lastMessageTime: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Message saved successfully:', newMessage._id);
    
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

// Delete duplicate chats for a user-provider pair (Run once to clean up)
router.post('/cleanup-duplicates', protectUser, async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.userId;
    
    // Find all chats for this user-provider pair
    const chats = await Chat.find({
      'participants.user.userId': userId,
      'participants.provider.providerId': providerId
    });
    
    if (chats.length <= 1) {
      return res.status(200).json({
        success: true,
        message: 'No duplicates found',
        deletedCount: 0
      });
    }
    
    // Keep the most recent chat, delete others
    const sortedChats = chats.sort((a, b) => b.updatedAt - a.updatedAt);
    const keepChat = sortedChats[0];
    const deleteChats = sortedChats.slice(1);
    
    // Move messages from duplicate chats to the kept chat
    for (const duplicateChat of deleteChats) {
      await Message.updateMany(
        { chatId: duplicateChat._id.toString() },
        { chatId: keepChat._id.toString() }
      );
      await Chat.findByIdAndDelete(duplicateChat._id);
    }
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${deleteChats.length} duplicate chats`,
      deletedCount: deleteChats.length,
      keptChatId: keepChat._id
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = { router, saveMessage };