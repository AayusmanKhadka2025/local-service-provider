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

// Send verification email
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

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

    <tr>
      <td style="background:#ffffff; border-radius:12px; padding:30px 20px;">

        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#2563eb; margin:0; font-size:32px; font-weight:700;">
            ServEase
          </h1>
        </div>

        <h2 style="color:#1f2937; font-size:22px; text-align:center; margin:0 0 15px;">
          Verify Your Email Address
        </h2>

        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 25px;">
          Thank you for registering with ServEase.  
          Use the OTP below to verify your email and complete your registration.
        </p>

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

        <p style="text-align:center; color:#6b7280; font-size:13px; margin:0;">
          This OTP is valid for 10 minutes
        </p>

        <p style="text-align:center; color:#9ca3af; font-size:13px; margin:25px 0 0;">
          If you didn't create an account, you can safely ignore this email.
        </p>

       </td>
    </tr>

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

// Send password reset email
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

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

    <tr>
      <td style="background:#ffffff; border-radius:12px; padding:30px 20px;">

        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#2563eb; margin:0; font-size:32px; font-weight:700;">
            ServEase
          </h1>
        </div>

        <h2 style="color:#1f2937; font-size:22px; text-align:center; margin:0 0 15px;">
          Reset Your Password
        </h2>

        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          Hello <strong>${fullName}</strong>,
        </p>

        <p style="color:#4b5563; font-size:15px; line-height:1.6; text-align:center; margin:0 0 20px;">
          We received a request to reset your ServEase password for your account associated with <strong>${email}</strong>.
        </p>

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

        <p style="color:#9ca3af; font-size:13px; text-align:center; margin:25px 0 0;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>

        <p style="color:#9ca3af; font-size:13px; text-align:center; margin:15px 0 0;">
          Thanks,<br>
          Your ServEase team
        </p>

       </td>
    </tr>

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

// Send verification complete email (when admin approves provider)
const sendVerificationCompleteEmail = async (email, fullName) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  
  const mailOptions = {
    from: `"ServEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Your ServEase Provider Account Has Been Verified!",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Account Verified - ServEase</title>
<style>
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin-top: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .button:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
  }
</style>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:40px 20px;">
<tr>
<td align="center">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    
    <!-- Header with Logo -->
    <tr>
      <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding:30px 20px; text-align:center;">
        
        <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:700;">Account Verified!</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding:40px 30px; text-align:center;">
        <p style="color:#4b5563; font-size:16px; line-height:1.6; margin-bottom:20px;">
          Dear <strong style="color:#2563eb;">${fullName}</strong>,
        </p>
        
        <p style="color:#4b5563; font-size:15px; line-height:1.6; margin-bottom:25px;">
          Congratulations! Your Service Provider account has been <strong style="color:#22c55e;">verified</strong> by our admin team.
        </p>
        
        <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:15px 20px; margin-bottom:25px; text-align:left; border-radius:8px;">
          <p style="margin:0 0 5px 0; font-weight:600; color:#166534;">What you can do now:</p>
          <ul style="margin:5px 0 0 0; padding-left:20px; color:#14532d;">
            <li>Log in to your provider dashboard</li>
            <li>Manage your availability and services</li>
            <li>Start accepting booking requests</li>
            <li>Build your reputation with customer reviews</li>
          </ul>
        </div>
        
        <a href="${loginUrl}" class="button" style="display:inline-block; background:linear-gradient(135deg, #2563eb, #3b82f6); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:600; font-size:16px; margin-top:10px;">
          Login to Your Account →
        </a>
        
        <p style="color:#9ca3af; font-size:12px; margin-top:30px; line-height:1.5;">
          If you have any questions, please contact our support team at 
          <a href="mailto:servease2082@gmail.com" style="color:#3b82f6; text-decoration:none;">servease2082@gmail.com</a>
        </p>
        
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0 20px 0;">
        
        <p style="color:#9ca3af; font-size:11px; margin:0;">
          © 2026 ServEase. All rights reserved.<br>
          Making local services better, together.
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
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification complete email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Verification complete email error:", error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCompleteEmail,
};