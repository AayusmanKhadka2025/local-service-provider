const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Delete User Account
const deleteUserAccount = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const authenticatedUserId = req.userId;

    // Verify user is deleting their own account
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log deletion reason for analytics (optional)
    console.log(`User account deletion requested: ${user.email}`);
    console.log(`Reason: ${reason}`);
    console.log(`User ID: ${userId}`);

    // Find all bookings for this user
    const userBookings = await Booking.find({ 'user.userId': userId });
    
    // Delete all chats and messages related to this user
    for (const booking of userBookings) {
      // Find chats associated with this booking
      const chats = await Chat.find({ bookingId: booking._id });
      for (const chat of chats) {
        // Delete all messages in the chat
        await Message.deleteMany({ chatId: chat._id.toString() });
        // Delete the chat
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
};

// Delete Provider Account
const deleteProviderAccount = async (req, res) => {
  try {
    const { providerId, reason } = req.body;
    const authenticatedProviderId = req.providerId;

    // Verify provider is deleting their own account
    if (providerId !== authenticatedProviderId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this account'
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Log deletion reason for analytics (optional)
    console.log(`Provider account deletion requested: ${provider.email}`);
    console.log(`Reason: ${reason}`);
    console.log(`Provider ID: ${providerId}`);

    // Find all bookings for this provider
    const providerBookings = await Booking.find({ 'provider.providerId': providerId });
    
    // Delete all chats and messages related to this provider
    for (const booking of providerBookings) {
      // Find chats associated with this booking
      const chats = await Chat.find({ bookingId: booking._id });
      for (const chat of chats) {
        // Delete all messages in the chat
        await Message.deleteMany({ chatId: chat._id.toString() });
        // Delete the chat
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
};

module.exports = {
  deleteUserAccount,
  deleteProviderAccount
};