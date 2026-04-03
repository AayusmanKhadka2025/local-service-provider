const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const providerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening', 'HVAC', 'Appliance Repair']
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  availableDays: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }],
  // NEW FIELDS
  profileImage: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    default: ''
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    default: ''
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    default: 0,
    min: 0
  },
  serviceArea: {
    type: String,
    default: ''
  },
  serviceTags: [{
    type: String
  }],
  // Documents
  documents: {
    governmentId: {
      fileName: String,
      filePath: String,
      uploadedAt: Date
    },
    portfolio: {
      fileName: String,
      filePath: String,
      uploadedAt: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isVerified: {
  type: Boolean,
  default: false  
}
});

// Hash password before saving
providerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
providerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
providerSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;