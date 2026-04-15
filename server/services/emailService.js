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

        <p style="text-align:center; color:#6b7280; font-size:14px; margin:6px 0 25px;">
          Premium Local Service Platform
        </p>

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

// NEW: Send password reset email
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

        <p style="text-align:center; color:#6b7280; font-size:14px; margin:6px 0 25px;">
          Premium Local Service Platform
        </p>

        <!-- Title -->
        <h2 style="color:#1f2937; font-size:22px; text-align:center; margin:0 0 15px;">
          Reset Your Password
        </h2>

        <!-- Message -->
        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          Hello <strong>${fullName}</strong>,
        </p>

        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          Follow this link to reset your ServEase password for your <strong>${email}</strong> account.
        </p>

        <!-- Reset Button -->
        <div style="text-align:center; margin:25px 0;">
          <a href="${resetUrl}" style="
            display:inline-block;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color:#ffffff;
            text-decoration:none;
            padding:14px 32px;
            border-radius:8px;
            font-weight:600;
            font-size:16px;
          ">
            Reset Password
          </a>
        </div>

        <!-- Alternative Link -->
        <p style="color:#6b7280; font-size:13px; text-align:center; margin:15px 0; word-break:break-all;">
          Or copy this link: <br>
          <a href="${resetUrl}" style="color:#3b82f6; text-decoration:none;">${resetUrl}</a>
        </p>

        <!-- Note -->
        <p style="color:#9ca3af; font-size:13px; text-align:center; margin:25px 0 0;">
          If you didn't ask to reset your password, you can ignore this email.
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

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail, // Add this export
};