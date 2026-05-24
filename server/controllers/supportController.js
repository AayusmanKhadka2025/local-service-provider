const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Admin = require('../models/Admin');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/support');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function for file URLs
const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `http://localhost:5050${filePath}`;
};

// Create a new support ticket (User or Provider)
const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, userType } = req.body;
    
    let userId, userName, userEmail;
    
    if (userType === 'user') {
      userId = req.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      userName = user.fullName;
      userEmail = user.email;
    } else if (userType === 'provider') {
      userId = req.providerId;
      const provider = await Provider.findById(userId);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }
      userName = `${provider.firstName} ${provider.lastName}`;
      userEmail = provider.email;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }
    
    // Handle attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          fileName: file.originalname,
          filePath: `/uploads/support/${file.filename}`,
          fileType: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }
    
    const ticket = await SupportTicket.create({
      userType,
      userId,
      userName,
      userEmail,
      subject,
      message,
      attachments,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        attachments: ticket.attachments.map(a => ({
          ...a.toObject(),
          filePath: getFileUrl(a.filePath)
        })),
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's support tickets
const getUserTickets = async (req, res) => {
  try {
    const userId = req.userId;
    const tickets = await SupportTicket.find({ 
      userType: 'user', 
      userId: userId 
    }).sort({ createdAt: -1 });
    
    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      attachments: ticket.attachments.map(a => ({
        ...a.toObject(),
        filePath: getFileUrl(a.filePath)
      })),
      adminReplies: ticket.adminReplies.map(reply => ({
        ...reply.toObject(),
        attachments: reply.attachments?.map(a => ({
          ...a,
          filePath: getFileUrl(a.filePath)
        })) || []
      })),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      tickets: formattedTickets
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get provider's support tickets
const getProviderTickets = async (req, res) => {
  try {
    const providerId = req.providerId;
    const tickets = await SupportTicket.find({ 
      userType: 'provider', 
      userId: providerId 
    }).sort({ createdAt: -1 });
    
    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      attachments: ticket.attachments.map(a => ({
        ...a.toObject(),
        filePath: getFileUrl(a.filePath)
      })),
      adminReplies: ticket.adminReplies.map(reply => ({
        ...reply.toObject(),
        attachments: reply.attachments?.map(a => ({
          ...a,
          filePath: getFileUrl(a.filePath)
        })) || []
      })),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      tickets: formattedTickets
    });
  } catch (error) {
    console.error('Get provider tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all support tickets (Admin)
const getAllSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    
    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      userType: ticket.userType,
      userId: ticket.userId,
      userName: ticket.userName,
      userEmail: ticket.userEmail,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      attachments: ticket.attachments.map(a => ({
        ...a.toObject(),
        filePath: getFileUrl(a.filePath)
      })),
      adminReplies: ticket.adminReplies.map(reply => ({
        ...reply.toObject(),
        attachments: reply.attachments?.map(a => ({
          ...a,
          filePath: getFileUrl(a.filePath)
        })) || []
      })),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      tickets: formattedTickets
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin reply to support ticket
const adminReplyToTicket = async (req, res) => {
  try {
    const { ticketId, message } = req.body;
    const adminId = req.adminId;
    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Handle attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          fileName: file.originalname,
          filePath: `/uploads/support/${file.filename}`,
          fileType: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }
    
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Add admin reply
    ticket.adminReplies.push({
      adminId: admin._id,
      adminName: admin.fullName || admin.username,
      message,
      attachments,
      createdAt: new Date()
    });
    
    // Update status to in_progress if still pending
    if (ticket.status === 'pending') {
      ticket.status = 'in_progress';
    }
    
    ticket.updatedAt = new Date();
    await ticket.save();
    
    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      reply: {
        adminName: admin.fullName || admin.username,
        message,
        attachments: attachments.map(a => ({
          ...a,
          filePath: getFileUrl(a.filePath)
        })),
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update ticket status (Admin)
const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId, status } = req.body;
    
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    ticket.status = status;
    ticket.updatedAt = new Date();
    await ticket.save();
    
    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      status
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single ticket details
const getTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const formattedTicket = {
      _id: ticket._id,
      userType: ticket.userType,
      userId: ticket.userId,
      userName: ticket.userName,
      userEmail: ticket.userEmail,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      attachments: ticket.attachments.map(a => ({
        ...a.toObject(),
        filePath: getFileUrl(a.filePath)
      })),
      adminReplies: ticket.adminReplies.map(reply => ({
        ...reply.toObject(),
        attachments: reply.attachments?.map(a => ({
          ...a,
          filePath: getFileUrl(a.filePath)
        })) || []
      })),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    };
    
    res.status(200).json({
      success: true,
      ticket: formattedTicket
    });
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createSupportTicket,
  getUserTickets,
  getProviderTickets,
  getAllSupportTickets,
  adminReplyToTicket,
  updateTicketStatus,
  getTicketDetails
};