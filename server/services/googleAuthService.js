const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Provider = require('../models/Provider');
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
      console.log('Google profile received:', profile.id);
      
      const { id, displayName, emails, photos } = profile;
      const email = emails && emails[0] ? emails[0].value : null;
      
      if (!email) {
        console.error('No email found in Google profile');
        return done(new Error('No email provided by Google'), null);
      }
      
      const fullName = displayName;
      const avatar = photos && photos[0] ? photos[0].value : '';
      
      console.log('Processing Google auth for email:', email);
      
      // CRITICAL: Check if email is already registered as a PROVIDER
      const existingProvider = await Provider.findOne({ email: email.toLowerCase() });
      
      // If email exists as a provider, block access regardless of intent
      if (existingProvider) {
        console.log('Blocked: Email already registered as provider:', email);
        return done(null, false, { 
          message: 'This email is already registered as a Service Provider. Please use the provider login.',
          isProvider: true 
        });
      }
      
      // Check if user exists
      let user = await User.findOne({ email: email.toLowerCase() });
      let isNewUser = false;
      
      if (!user) {
        // Create new user only if no provider exists with this email
        console.log('Creating new user for:', email);
        user = await User.create({
          fullName,
          email: email.toLowerCase(),
          password: Math.random().toString(36).slice(-16),
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
        isNewUser = true;
        console.log('New user created with ID:', user._id);
      } else {
        console.log('Existing user found:', user._id);
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = id;
          if (avatar && !user.avatar) {
            user.avatar = avatar;
          }
          await user.save();
          console.log('User updated with Google ID');
        }
      }
      
      const userObject = user.toObject();
      userObject.isNewUser = isNewUser;
      
      return done(null, userObject);
      
    } catch (error) {
      console.error('Google Strategy Error:', error);
      return done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
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