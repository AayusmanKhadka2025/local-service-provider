const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token for users
const generateUserToken = (userId, email, fullName) => {
  return jwt.sign(
    { id: userId, email, fullName, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to get full avatar URL
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `http://localhost:5050${avatarPath}`;
};

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      const fullName = displayName;
      const avatar = photos[0]?.value || '';
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user for signup
        user = await User.create({
          fullName,
          email,
          password: Math.random().toString(36).slice(-16), // Random password for Google users
          phone: '',
          gender: 'Prefer not to say',
          country: 'Nepal',
          province: '',
          city: '',
          area: '',
          landmark: '',
          avatar: avatar,
          googleId: id,
          isGoogleAccount: true
        });
        
        return done(null, { user, isNewUser: true });
      }
      
      // Update Google ID if not set (for existing users)
      if (!user.googleId) {
        user.googleId = id;
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
      
      return done(null, { user, isNewUser: false });
      
    } catch (error) {
      console.error('Google Strategy Error:', error);
      return done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = {
  generateUserToken,
  getFullAvatarUrl
};