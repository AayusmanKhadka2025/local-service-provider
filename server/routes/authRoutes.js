const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController'); // ✅ Add loginUser

const router = express.Router();

// Register route
router.post('/register', registerUser);

// ✅ NEW: Login route
router.post('/login', loginUser);

module.exports = router;