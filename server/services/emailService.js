const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your email password or app password
  }
});

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, fullName, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - ServEase',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #60a5fa); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">🏠</span>
          </div>
          <h1 style="color: #1f2937; margin-top: 10px;">ServEase</h1>
        </div>
        
        <h2 style="color: #1f2937;">Welcome, ${fullName}! 👋</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
          Thank you for signing up for ServEase! Please use the verification code below to complete your registration:
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #3b82f6; margin: 0;">${otp}</h1>
        </div>
        
        <p style="color: #4b5563; font-size: 14px;">
          This code will expire in <strong>10 minutes</strong>.
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
          If you didn't request this, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © 2024 ServEase. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail
};