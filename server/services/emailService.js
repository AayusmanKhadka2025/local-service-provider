const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email - Ultra simple version (PRESERVED - NO CHANGES)
const sendVerificationEmail = async (email, fullName, otp) => {
  const mailOptions = {
    from: `"ServEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - ServEase",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Email</title>
</head>

<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:20px 10px;">
<tr>
<td align="center">

  <!-- Container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

    <!-- Card -->
    <tr>
      <td style="background:#ffffff; border-radius:12px; padding:30px 20px;">

        <!-- Logo -->
        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#2563eb; margin:0; font-size:32px; font-weight:700;">
            ServEase
          </h1>
        </div>

        <!-- Title -->
        <h2 style="color:#1f2937; font-size:22px; text-align:center; margin:0 0 15px;">
          Verify Your Email Address
        </h2>

        <!-- Message -->
        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 25px;">
          Thank you for registering with ServEase.  
          Use the OTP below to verify your email and complete your registration.
        </p>

        <!-- OTP Box -->
        <div style="text-align:center; margin:25px 0;">
          <div style="
            display:inline-block;
            font-size:34px;
            font-weight:bold;
            letter-spacing:6px;
            color:#2563eb;
            background:#f3f4f6;
            padding:15px 20px;
            border-radius:10px;
            border:2px dashed #3b82f6;
            font-family:'Courier New', monospace;
            max-width:100%;
            box-sizing:border-box;
          ">
            ${otp}
          </div>
        </div>

        <!-- Validity -->
        <p style="text-align:center; color:#6b7280; font-size:13px; margin:0;">
          This OTP is valid for 10 minutes
        </p>

        <!-- Note -->
        <p style="text-align:center; color:#9ca3af; font-size:13px; margin:25px 0 0;">
          If you didn't create an account, you can safely ignore this email.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="text-align:center; padding:20px 10px; color:#9ca3af; font-size:12px;">
        Need help? 
        <a href="mailto:servease2082@gmail.com" style="color:#3b82f6; text-decoration:none;">
          support@servease.com
        </a>
        <br><br>
        © 2026 ServEase. All rights reserved.
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    return false;
  }
};

// Updated: Send password reset email with button only (no plain text link)
const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  const mailOptions = {
    from: `"ServEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - ServEase",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password</title>
</head>

<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:20px 10px;">
<tr>
<td align="center">

  <!-- Container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

    <!-- Card -->
    <tr>
      <td style="background:#ffffff; border-radius:12px; padding:30px 20px;">

        <!-- Logo -->
        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#2563eb; margin:0; font-size:32px; font-weight:700;">
            ServEase
          </h1>
        </div>

        <!-- Title -->
        <h2 style="color:#1f2937; font-size:22px; text-align:center; margin:0 0 15px;">
          Reset Your Password
        </h2>

        <!-- Message -->
        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          Hello <strong>${fullName}</strong>,
        </p>

        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          We received a request to reset your ServEase password for your account associated with <strong>${email}</strong>.
        </p>

        <!-- Reset Button Only -->
        <div style="text-align:center; margin:30px 0;">
          <a href="${resetUrl}" style="
            display:inline-block;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color:#ffffff;
            text-decoration:none;
            padding:14px 32px;
            border-radius:8px;
            font-weight:600;
            font-size:16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            Reset Password
          </a>
        </div>

        <!-- Note -->
        <p style="color:#9ca3af; font-size:13px; text-align:center; margin:25px 0 0;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>

        <p style="color:#9ca3af; font-size:13px; text-align:center; margin:15px 0 0;">
          Thanks,<br>
          Your ServEase team
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="text-align:center; padding:20px 10px; color:#9ca3af; font-size:12px;">
        Need help? 
        <a href="mailto:servease2082@gmail.com" style="color:#3b82f6; text-decoration:none;">
          support@servease.com
        </a>
        <br><br>
        © 2026 ServEase. All rights reserved.
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Password reset email error:", error);
    return false;
  }
};

// Add this to your emailService.js if not already present
const sendVerificationCompleteEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"ServEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your ServEase Provider Account Has Been Verified!",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Account Verified</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px; background:#ffffff; border-radius:16px; padding:40px;">
          <tr>
            <td style="text-align:center;">
              <div style="width:60px; height:60px; background:#22c55e; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px;">
                <span style="font-size:30px;">✅</span>
              </div>
              <h2 style="color:#1f2937; margin-bottom:10px;">Account Verified!</h2>
              <p style="color:#4b5563; line-height:1.6; margin-bottom:20px;">
                Dear <strong>${fullName}</strong>,
              </p>
              <p style="color:#4b5563; line-height:1.6; margin-bottom:20px;">
                Congratulations! Your Service Provider account has been verified by the admin.
                You can now log in to your account and start accepting bookings.
              </p>
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="display:inline-block; background:#2563eb; color:white; text-decoration:none; padding:12px 32px; border-radius:8px; font-weight:600; margin-top:10px;">
                Login Now
              </a>
              <p style="color:#9ca3af; font-size:12px; margin-top:30px;">
                Thank you for choosing ServEase!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification complete email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Verification email error:", error);
    return false;
  }
};

// Update the verifyProvider function in adminController.js
const verifyProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.isVerified = true;
    await provider.save();

    // Send verification complete email
    const fullName = `${provider.firstName} ${provider.lastName}`;
    await sendVerificationCompleteEmail(provider.email, fullName);

    res.status(200).json({
      success: true,
      message: "Provider verified successfully. Email notification sent.",
    });
  } catch (error) {
    console.error("Verify provider error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCompleteEmail, // Add this
};
