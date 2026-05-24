const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const providerRoutes = require('./routes/providerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { router: chatRoutes, saveMessage } = require('./routes/chatRoutes');
const accountRoutes = require('./routes/accountRoutes');
const supportRoutes = require('./routes/supportRoutes');



// Import Google Auth Service
require('./services/googleAuthService');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);



// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

// Socket.IO connection handling
const connectedUsers = new Map();
// Server-side deduplication: track recently processed message IDs
const processedMessages = new Set();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User authentication and room joining
  socket.on('register', (data) => {
    const { userId, userType } = data;
    connectedUsers.set(userId, { socketId: socket.id, userType });
    socket.join(`user_${userId}`);
    console.log(`User ${userId} (${userType}) registered`);
  });

  // Join a specific chat room
  socket.on('join_chat', (data) => {
    const { chatId } = data;
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Send message with server-side deduplication
  socket.on('send_message', async (data) => {
    try {
      const { chatId, senderId, senderType, receiverId, receiverType, message, messageType, mediaUrl, senderName, providerName, providerAvatar, userName, bookingId, tempId } = data;
      
      // Generate a unique message signature for deduplication
      const messageSignature = `${senderId}_${receiverId}_${Date.now()}_${(message || mediaUrl || '').substring(0, 30)}`;
      
      // Check for duplicate on server side
      if (processedMessages.has(messageSignature)) {
        console.log('Duplicate message detected on server, skipping');
        return;
      }
      processedMessages.add(messageSignature);
      
      // Clean up after 2 seconds
      setTimeout(() => {
        processedMessages.delete(messageSignature);
      }, 2000);
      
      console.log('Sending message:', { senderId, receiverId, message: message ? message.substring(0, 50) : 'media message' });
      
      const result = await saveMessage({
        chatId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        message,
        messageType,
        mediaUrl,
        senderName,
        providerName,
        providerAvatar,
        userName,
        bookingId
      });
      
      if (result.success) {
        // Emit to all clients in the chat room
        io.to(`chat_${result.chatId}`).emit('new_message', {
          ...result.message.toObject(),
          _id: result.message._id
        });
        
        // Send notification to receiver
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('message_notification', {
            chatId: result.chatId,
            senderName: senderType === 'user' ? senderName : providerName,
            message: messageType === 'text' ? message : `Sent a ${messageType}`,
            time: new Date()
          });
        }
      } else {
        console.error('Save message failed:', result.error);
        socket.emit('message_error', { error: result.error });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    try {
      const { chatId, userId } = data;
      const Message = require('./models/Message');
      await Message.updateMany(
        { chatId, receiverId: userId, read: false },
        { read: true }
      );
      io.to(`chat_${chatId}`).emit('messages_read', { chatId, userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove from connected users
    for (const [userId, data] of connectedUsers.entries()) {
      if (data.socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "local-services-db",
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");

    const fs = require("fs");
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
      console.log("✅ Uploads directory created");
    }
    
    const chatUploadDir = path.join(__dirname, "uploads/chat");
    if (!fs.existsSync(chatUploadDir)) {
      fs.mkdirSync(chatUploadDir, { recursive: true });
      console.log("✅ Chat uploads directory created");
    }

    const { createInitialAdmin } = require('./controllers/adminController');
    createInitialAdmin();

    const PORT = process.env.PORT || 5050;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});