const Provider = require("../models/Provider");
const User = require("../models/User");
const ProviderOTP = require("../models/ProviderOTP");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  generateOTP,
  sendVerificationEmail,
} = require("../services/emailService");

// Ensure upload directories exist
const uploadDir = path.join(__dirname, "../uploads/providers");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate JWT Token for providers
const generateProviderToken = (providerId, email) => {
  return jwt.sign(
    { id: providerId, email, role: "provider" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Send OTP for provider registration
const sendProviderOTP = async (req, res) => {
  try {
    const formData = req.body;
    const { email, firstName, lastName } = formData;

    console.log("Sending provider OTP to:", email);

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email is already registered as a USER
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered as a customer. Please use a different email or login as customer.",
      });
    }

    // Check if email is already registered as a PROVIDER (pending or verified)
    const existingProvider = await Provider.findOne({
      email: email.toLowerCase(),
    });
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered as a service provider. Please login instead.",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store provider data temporarily with OTP
    await ProviderOTP.create({
      email: email.toLowerCase(),
      otp,
      providerData: formData,
    });

    // Send verification email
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    const emailSent = await sendVerificationEmail(
      email,
      fullName || email,
      otp,
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      email: email,
    });
  } catch (error) {
    console.error("Send provider OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify OTP and complete provider registration
const verifyProviderOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("Verifying provider OTP for:", email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find OTP record
    const otpRecord = await ProviderOTP.findOne({
      email: email.toLowerCase(),
      otp,
    });

    if (!otpRecord) {
      console.log("Invalid or expired OTP for:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    console.log("OTP found, creating provider account for:", email);

    const providerData = otpRecord.providerData;

    // Parse JSON fields
    const parsedDays =
      typeof providerData.availableDays === "string"
        ? JSON.parse(providerData.availableDays)
        : providerData.availableDays || [];

    const parsedTags =
      typeof providerData.serviceTags === "string"
        ? JSON.parse(providerData.serviceTags)
        : providerData.serviceTags || [];

    // Handle file uploads (they should already be processed by multer)
    let profileImagePath = "";
    let governmentIdPath = "";
    let portfolioPath = "";

    // If files were uploaded via multer, they would be in req.files
    // Since this is called after file upload, we need to handle it differently
    // For now, we'll assume files are already processed in the registration flow

    // Create provider account
    const provider = await Provider.create({
      firstName: providerData.firstName,
      lastName: providerData.lastName,
      email: email.toLowerCase(),
      phone: providerData.phone,
      password: providerData.password,
      category: providerData.category,
      experience: providerData.experience,
      description: providerData.description,
      availableDays: parsedDays,
      serviceTags: parsedTags,
      address: providerData.address,
      city: providerData.city,
      hourlyRate: parseFloat(providerData.hourlyRate),
      serviceArea: providerData.serviceArea || "",
      profileImage: providerData.profileImage || "",
      documents: {
        governmentId: providerData.governmentId || {},
        portfolio: providerData.portfolio || {},
      },
      isVerified: false, // Requires admin approval
      isActive: true,
    });

    console.log("Provider created successfully:", provider._id);

    // Delete OTP record
    await ProviderOTP.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      success: true,
      message:
        "Email verified and provider account created successfully! Please wait for admin approval before logging in.",
      email: provider.email,
    });
  } catch (error) {
    console.error("Verify provider OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Provider already exists with this email",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Resend provider OTP
const resendProviderOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find existing OTP record
    const otpRecord = await ProviderOTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "No pending verification found. Please register again.",
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();

    // Update OTP
    otpRecord.otp = newOTP;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    // Send new verification email
    const providerData = otpRecord.providerData;
    const fullName =
      `${providerData.firstName || ""} ${providerData.lastName || ""}`.trim();
    const emailSent = await sendVerificationEmail(
      email,
      fullName || email,
      newOTP,
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email.",
    });
  } catch (error) {
    console.error("Resend provider OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All Providers (for service listing)
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({
      isActive: true,
      isVerified: true, // Only show verified providers
    })
      .select("-password -documents")
      .sort({ rating: -1, createdAt: -1 });

    const formattedProviders = providers.map((provider) => ({
      _id: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      category: provider.category,
      experience: provider.experience,
      description: provider.description,
      availableDays: provider.availableDays,
      serviceTags: provider.serviceTags || [],
      address: provider.address,
      city: provider.city,
      hourlyRate: provider.hourlyRate,
      serviceArea: provider.serviceArea,
      profileImage: provider.profileImage
        ? `http://localhost:5050${provider.profileImage}`
        : "",
      rating: provider.rating || 0,
      totalReviews: provider.totalReviews || 0,
      completedJobs: provider.completedJobs || 0,
      isVerified: provider.isVerified,
      createdAt: provider.createdAt,
    }));

    res.status(200).json({
      success: true,
      providers: formattedProviders,
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Provider Registration (Original - kept for reference but not used directly anymore)
const registerProvider = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      category,
      experience,
      description,
      availableDays,
      serviceTags,
      address,
      city,
      hourlyRate,
      serviceArea,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword ||
      !category ||
      !experience ||
      !description ||
      !availableDays
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate new required fields
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }
    if (!hourlyRate) {
      return res.status(400).json({
        success: false,
        message: "Hourly rate is required",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if email is already registered as a USER
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered as a customer. Please use a different email.",
      });
    }

    // Check if provider already exists
    const existingProvider = await Provider.findOne({
      email: email.toLowerCase(),
    });
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: "Provider already registered with this email",
      });
    }

    // Check if documents were uploaded
    if (!req.files || !req.files.governmentId || !req.files.portfolio) {
      return res.status(400).json({
        success: false,
        message: "Both Government ID and Portfolio documents are required",
      });
    }

    // Parse JSON fields
    const parsedDays =
      typeof availableDays === "string"
        ? JSON.parse(availableDays)
        : availableDays;
    const parsedTags =
      typeof serviceTags === "string"
        ? JSON.parse(serviceTags)
        : serviceTags || [];

    // Handle profile image if uploaded
    let profileImagePath = "";
    if (req.files.profileImage) {
      profileImagePath = `/uploads/providers/${req.files.profileImage[0].filename}`;
    }

    // Create provider with all fields
    const provider = await Provider.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      category,
      experience,
      description,
      availableDays: parsedDays,
      serviceTags: parsedTags,
      address,
      city,
      hourlyRate: parseFloat(hourlyRate),
      serviceArea: serviceArea || "",
      profileImage: profileImagePath,
      documents: {
        governmentId: {
          fileName: req.files.governmentId[0].originalname,
          filePath: `/uploads/providers/${req.files.governmentId[0].filename}`,
          uploadedAt: new Date(),
        },
        portfolio: {
          fileName: req.files.portfolio[0].originalname,
          filePath: `/uploads/providers/${req.files.portfolio[0].filename}`,
          uploadedAt: new Date(),
        },
      },
    });

    console.log("Provider registered successfully:", email);

    // Remove password from response
    const providerWithoutPassword = {
      _id: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      category: provider.category,
      experience: provider.experience,
      description: provider.description,
      availableDays: provider.availableDays,
      serviceTags: provider.serviceTags,
      address: provider.address,
      city: provider.city,
      hourlyRate: provider.hourlyRate,
      serviceArea: provider.serviceArea,
      profileImage: provider.profileImage
        ? `http://localhost:5050${provider.profileImage}`
        : "",
      createdAt: provider.createdAt,
    };

    res.status(201).json({
      success: true,
      message:
        "Registration successful! You can now login with your credentials.",
      provider: providerWithoutPassword,
    });
  } catch (error) {
    console.error("Provider registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Provider Login - Check if verified
const providerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // First check if email exists as a USER
    const User = require("../models/User");
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(401).json({
        success: false,
        message:
          "This email is registered as a Customer. Please login from the Customer Login page.",
      });
    }

    // Then check as PROVIDER
    const provider = await Provider.findOne({ email: email.toLowerCase() });

    if (!provider) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!provider.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Check if provider is verified - CRITICAL: Return specific error for unverified
    if (!provider.isVerified) {
      return res.status(403).json({
        success: false,
        message: "UNVERIFIED_ACCOUNT",
        requiresVerification: true,
        email: provider.email,
        messageForUser:
          "Your account is yet to be verified. We will notify you through email once the verification is complete.",
      });
    }

    // Verify password
    const isPasswordValid = await provider.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    await provider.updateLastLogin();

    // Generate token
    const token = generateProviderToken(provider._id, provider.email);

    const providerData = {
      _id: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      category: provider.category,
      experience: provider.experience,
      description: provider.description,
      availableDays: provider.availableDays,
      serviceTags: provider.serviceTags,
      address: provider.address,
      city: provider.city,
      hourlyRate: provider.hourlyRate,
      serviceArea: provider.serviceArea,
      profileImage: provider.profileImage
        ? `http://localhost:5050${provider.profileImage}`
        : "",
      rating: provider.rating,
      totalReviews: provider.totalReviews,
      completedJobs: provider.completedJobs,
      isActive: provider.isActive,
      isVerified: provider.isVerified,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      provider: providerData,
    });
  } catch (error) {
    console.error("Provider login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Get provider profile by email
const getProviderProfile = async (req, res) => {
  try {
    const { email } = req.params;

    const provider = await Provider.findOne({
      email: email.toLowerCase(),
    }).select("-password -documents");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const providerData = {
      _id: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      category: provider.category,
      experience: provider.experience,
      description: provider.description,
      availableDays: provider.availableDays,
      serviceTags: provider.serviceTags || [],
      address: provider.address,
      city: provider.city,
      hourlyRate: provider.hourlyRate,
      serviceArea: provider.serviceArea,
      profileImage: provider.profileImage
        ? `http://localhost:5050${provider.profileImage}`
        : null,
      rating: provider.rating || 0,
      totalReviews: provider.totalReviews || 0,
      isVerified: provider.isVerified,
      createdAt: provider.createdAt,
    };

    res.status(200).json({
      success: true,
      provider: providerData,
    });
  } catch (error) {
    console.error("Get provider profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update provider profile
const updateProviderProfile = async (req, res) => {
  try {
    const providerId = req.providerId;
    const {
      firstName,
      lastName,
      phone,
      experience,
      description,
      address,
      city,
      hourlyRate,
      serviceArea,
      availableDays,
      serviceTags,
      profileImage,
    } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (firstName !== undefined) provider.firstName = firstName;
    if (lastName !== undefined) provider.lastName = lastName;
    if (phone !== undefined) provider.phone = phone;
    if (experience !== undefined) provider.experience = experience;
    if (description !== undefined) provider.description = description;
    if (address !== undefined) provider.address = address;
    if (city !== undefined) provider.city = city;
    if (hourlyRate !== undefined) provider.hourlyRate = parseFloat(hourlyRate);
    if (serviceArea !== undefined) provider.serviceArea = serviceArea;
    if (availableDays !== undefined) provider.availableDays = availableDays;
    if (serviceTags !== undefined) provider.serviceTags = serviceTags;

    if (profileImage !== undefined && profileImage !== provider.profileImage) {
      if (profileImage && profileImage.startsWith("http://localhost:5050")) {
        provider.profileImage = profileImage.replace(
          "http://localhost:5050",
          "",
        );
      } else if (profileImage && !profileImage.startsWith("http")) {
        provider.profileImage = profileImage;
      }
    }

    await provider.save();

    const updatedProvider = {
      _id: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      category: provider.category,
      experience: provider.experience,
      description: provider.description,
      availableDays: provider.availableDays,
      serviceTags: provider.serviceTags || [],
      address: provider.address,
      city: provider.city,
      hourlyRate: provider.hourlyRate,
      serviceArea: provider.serviceArea,
      profileImage: provider.profileImage
        ? `http://localhost:5050${provider.profileImage}`
        : null,
      rating: provider.rating,
      totalReviews: provider.totalReviews,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Update provider profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Upload provider avatar
const uploadProviderAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const providerId = req.providerId;
    const avatarPath = `/uploads/providers/${req.file.filename}`;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.profileImage = avatarPath;
    await provider.save();

    const fullAvatarUrl = `http://localhost:5050${avatarPath}`;

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: fullAvatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Change provider password
const changeProviderPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const providerId = req.providerId;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (provider.email !== email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const isPasswordValid = await provider.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    provider.password = newPassword;
    await provider.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  registerProvider,
  providerLogin,
  getAllProviders,
  sendProviderOTP,
  verifyProviderOTP,
  resendProviderOTP,
  getProviderProfile,
  updateProviderProfile,
  uploadProviderAvatar,
  changeProviderPassword,
};
