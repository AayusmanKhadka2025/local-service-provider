const Provider = require("../models/Provider");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

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

// Get All Providers (for service listing)
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ 
      isActive: true,
      isVerified: true  // Only show verified providers
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
      profileImage: provider.profileImage ? `http://localhost:5050${provider.profileImage}` : "",
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

// Provider Registration
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

    // Check if provider is verified
    if (!provider.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending verification. Please wait for admin approval.",
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
      profileImage: provider.profileImage ? `http://localhost:5050${provider.profileImage}` : "",
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

module.exports = {
  registerProvider,
  providerLogin,
  getAllProviders, // Make sure this is exported
};
