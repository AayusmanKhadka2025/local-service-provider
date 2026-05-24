const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Provider = require('../models/Provider');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
    if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
        allowedTypes.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  }
});

const fullUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `http://localhost:5050${p}`;
};

// Find or create chat — fetches real user avatar from User model
const findOrCreateChat = async (userId, providerId, userName, providerName, providerAvatar) => {
  let chat = await Chat.findOne({
    'participants.user.userId': userId,
    'participants.provider.providerId': providerId
  });

  if (!chat) {
    let realUserAvatar = '';
    try {
      const userDoc = await User.findById(userId).select('avatar');
      if (userDoc?.avatar) realUserAvatar = fullUrl(userDoc.avatar);
    } catch (_) {}

    chat = await Chat.create({
      participants: {
        user:     { userId, name: userName, avatar: realUserAvatar },
        provider: { providerId, name: providerName, avatar: providerAvatar || '' }
      },
      bookingId: null,
      lastMessage: '',
      lastMessageTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    // Back-fill user avatar if previously empty
    if (!chat.participants.user.avatar) {
      try {
        const userDoc = await User.findById(userId).select('avatar');
        if (userDoc?.avatar) {
          chat.participants.user.avatar = fullUrl(userDoc.avatar);
          await chat.save();
        }
      } catch (_) {}
    }
  }
  return chat;
};

router.post('/get-or-create', protectUser, async (req, res) => {
  try {
    const { providerId, providerName, providerAvatar } = req.body;
    const userId = req.userId;
    const user = req.user;
    if (!providerId) return res.status(400).json({ success: false, message: 'Provider ID is required' });
    const chat = await findOrCreateChat(userId, providerId, user.fullName || user.name, providerName, providerAvatar);
    res.status(200).json({
      success: true,
      chat: { _id: chat._id, participants: chat.participants, bookingId: chat.bookingId, createdAt: chat.createdAt }
    });
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// User chat list — ensures provider avatar is populated
router.get('/user/chats', protectUser, async (req, res) => {
  try {
    const userId = req.userId;
    const chats = await Chat.find({ 'participants.user.userId': userId }).sort({ lastMessageTime: -1 });
    const uniqueChats = [];
    const providerIds = new Set();

    for (const chat of chats) {
      const providerId = chat.participants.provider.providerId.toString();
      if (!providerIds.has(providerId)) {
        providerIds.add(providerId);

        if (!chat.participants.provider.avatar) {
          try {
            const pDoc = await Provider.findById(providerId).select('profileImage');
            if (pDoc?.profileImage) {
              chat.participants.provider.avatar = fullUrl(pDoc.profileImage);
              await chat.save();
            }
          } catch (_) {}
        }

        const lastMessage = await Message.findOne({ chatId: chat._id.toString() }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({ chatId: chat._id.toString(), receiverId: userId, read: false });
        uniqueChats.push({
          _id: chat._id, participants: chat.participants, bookingId: chat.bookingId,
          lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video') : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
          unreadCount, createdAt: chat.createdAt
        });
      }
    }
    res.status(200).json({ success: true, chats: uniqueChats });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Provider chat list — always refreshes user avatar from User model
router.get('/provider/chats', protectProvider, async (req, res) => {
  try {
    const providerId = req.providerId;
    const chats = await Chat.find({ 'participants.provider.providerId': providerId }).sort({ lastMessageTime: -1 });
    const uniqueChats = [];
    const userIds = new Set();

    for (const chat of chats) {
      const userId = chat.participants.user.userId.toString();
      if (!userIds.has(userId)) {
        userIds.add(userId);

        // Always refresh user's real avatar
        try {
          const userDoc = await User.findById(userId).select('avatar');
          if (userDoc?.avatar) {
            chat.participants.user.avatar = fullUrl(userDoc.avatar);
            await chat.save();
          }
        } catch (_) {}

        const lastMessage = await Message.findOne({ chatId: chat._id.toString() }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({ chatId: chat._id.toString(), receiverId: providerId, read: false });
        uniqueChats.push({
          _id: chat._id, participants: chat.participants, bookingId: chat.bookingId,
          lastMessage: lastMessage ? (lastMessage.messageType === 'text' ? lastMessage.message : lastMessage.messageType === 'image' ? '📷 Image' : '🎥 Video') : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.createdAt : chat.lastMessageTime,
          unreadCount, createdAt: chat.createdAt
        });
      }
    }
    res.status(200).json({ success: true, chats: uniqueChats });
  } catch (error) {
    console.error('Get provider chats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/messages/:chatId', protectUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat || chat.participants.user.userId.toString() !== req.userId.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized access to this chat' });
    const messages = await Message.find({ chatId: chatId.toString() }).sort({ createdAt: 1 });
    await Message.updateMany({ chatId: chatId.toString(), receiverId: req.userId, read: false }, { read: true });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/provider/messages/:chatId', protectProvider, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat || chat.participants.provider.providerId.toString() !== req.providerId.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized access to this chat' });
    const messages = await Message.find({ chatId: chatId.toString() }).sort({ createdAt: 1 });
    await Message.updateMany({ chatId: chatId.toString(), receiverId: req.providerId, read: false }, { read: true });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

const saveMessage = async (messageData) => {
  try {
    const { chatId, senderId, senderType, receiverId, receiverType, message, messageType, mediaUrl, senderName, providerName, providerAvatar, userName } = messageData;
    let finalChatId = chatId;
    let chat = null;

    if (!chatId || ['temp', 'null', 'undefined'].includes(String(chatId))) {
      chat = senderType === 'user'
        ? await findOrCreateChat(senderId, receiverId, senderName, providerName, providerAvatar)
        : await findOrCreateChat(receiverId, senderId, userName, providerName, providerAvatar);
      finalChatId = chat._id.toString();
    } else {
      chat = await Chat.findById(chatId);
      if (!chat) return { success: false, error: 'Chat not found' };
      finalChatId = chatId;
    }

    const newMessage = await Message.create({
      chatId: finalChatId, senderId, senderType, receiverId, receiverType,
      message: message || '', messageType: messageType || 'text',
      mediaUrl: mediaUrl || '', read: false, createdAt: new Date()
    });

    await Chat.findByIdAndUpdate(finalChatId, {
      lastMessage: messageType === 'text' ? (message || 'Media message') : (messageType === 'image' ? '📷 Image' : '🎥 Video'),
      lastMessageTime: new Date(),
      updatedAt: new Date()
    });

    return { success: true, message: newMessage, chatId: finalChatId };
  } catch (error) {
    console.error('Save message error:', error);
    return { success: false, error: error.message };
  }
};

router.post('/upload', protectUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.status(200).json({ success: true, fileUrl: `http://localhost:5050/uploads/chat/${req.file.filename}`, fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'video' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

router.post('/provider/upload', protectProvider, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.status(200).json({ success: true, fileUrl: `http://localhost:5050/uploads/chat/${req.file.filename}`, fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'video' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

router.post('/cleanup-duplicates', protectUser, async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.userId;
    const chats = await Chat.find({ 'participants.user.userId': userId, 'participants.provider.providerId': providerId });
    if (chats.length <= 1) return res.status(200).json({ success: true, message: 'No duplicates found', deletedCount: 0 });
    const sorted = chats.sort((a, b) => b.updatedAt - a.updatedAt);
    for (const dup of sorted.slice(1)) {
      await Message.updateMany({ chatId: dup._id.toString() }, { chatId: sorted[0]._id.toString() });
      await Chat.findByIdAndDelete(dup._id);
    }
    res.status(200).json({ success: true, deletedCount: sorted.length - 1, keptChatId: sorted[0]._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = { router, saveMessage };