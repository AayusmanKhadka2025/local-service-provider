const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { protectUser } = require('../middleware/auth');
const { protectProvider } = require('../middleware/providerAuth');
const { protectAdmin } = require('../middleware/adminAuth');
const {
  createSupportTicket,
  getUserTickets,
  getProviderTickets,
  getAllSupportTickets,
  adminReplyToTicket,
  updateTicketStatus,
  getTicketDetails
} = require('../controllers/supportController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/support');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and DOC files are allowed'));
    }
  }
});

// User routes
router.post('/create', upload.array('attachments', 5), (req, res, next) => {
  // Check if user or provider based on token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    // Will be handled by middleware
    next();
  } else {
    next();
  }
}, (req, res, next) => {
  // Determine user type from request body
  if (req.body.userType === 'user') {
    protectUser(req, res, next);
  } else if (req.body.userType === 'provider') {
    protectProvider(req, res, next);
  } else {
    next();
  }
}, createSupportTicket);

router.get('/user', protectUser, getUserTickets);
router.get('/provider', protectProvider, getProviderTickets);
router.get('/:ticketId', protectUser, getTicketDetails);

// Admin routes
router.get('/admin/all', protectAdmin, getAllSupportTickets);
router.post('/admin/reply', protectAdmin, upload.array('attachments', 5), adminReplyToTicket);
router.put('/admin/status', protectAdmin, updateTicketStatus);
router.get('/admin/ticket/:ticketId', protectAdmin, getTicketDetails);

module.exports = router;