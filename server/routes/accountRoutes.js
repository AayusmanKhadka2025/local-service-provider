const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Delete User Account
router.delete('/user', protectUser, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.userId;

    console.log('Delete user account request for:', userId);
    console.log('Reason:', reason);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log deletion reason
    console.log(`User account deletion: ${user.email} - Reason: ${reason}`);

    // Find all bookings for this user
    const userBookings = await Booking.find({ 'user.userId': userId });
    
    // Delete all chats and messages related to this user
    for (const booking of userBookings) {
      const chats = await Chat.find({ bookingId: booking._id });
      for (const chat of chats) {
        await Message.deleteMany({ chatId: chat._id.toString() });
        await Chat.findByIdAndDelete(chat._id);
      }
    }

    // Delete all payments made by this user
    await Payment.deleteMany({ userId: userId });

    // Delete all bookings made by this user
    await Booking.deleteMany({ 'user.userId': userId });

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    console.log(`User account deleted successfully: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete user account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete Provider Account
router.delete('/provider', protectProvider, async (req, res) => {
  try {
    const { reason } = req.body;
    const providerId = req.providerId;

    console.log('Delete provider account request for:', providerId);
    console.log('Reason:', reason);

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Log deletion reason
    console.log(`Provider account deletion: ${provider.email} - Reason: ${reason}`);

    // Find all bookings for this provider
    const providerBookings = await Booking.find({ 'provider.providerId': providerId });
    
    // Delete all chats and messages related to this provider
    for (const booking of providerBookings) {
      const chats = await Chat.find({ bookingId: booking._id });
      for (const chat of chats) {
        await Message.deleteMany({ chatId: chat._id.toString() });
        await Chat.findByIdAndDelete(chat._id);
      }
    }

    // Delete all payments received by this provider
    await Payment.deleteMany({ providerId: providerId });

    // Delete all bookings for this provider
    await Booking.deleteMany({ 'provider.providerId': providerId });

    // Finally delete the provider
    await Provider.findByIdAndDelete(providerId);

    console.log(`Provider account deleted successfully: ${provider.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;