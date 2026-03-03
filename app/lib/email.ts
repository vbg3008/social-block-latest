import nodemailer from 'nodemailer';

// If credentials are provided in env, use them. 
// Otherwise, create a test account using Ethereal Email which will output a preview URL to the console.
export async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true" || parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test account for local development
    console.warn("⚠️ No SMTP credentials found in .env. Using fallback test email (Ethereal).");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  const transporter = await getTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"SocialBlock" <noreply@socialblock.com>',
    to,
    subject: "Reset Your SocialBlock Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email and your password will remain unchanged. This link will expire in 1 hour.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  // If we are using the ethereal test account, we can log the preview URL for the developer
  if (!process.env.SMTP_HOST) {
    console.log("-----------------------------------------");
    console.log("✉️ Preview Password Reset Email:", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");
  }
  
  return info;
}
