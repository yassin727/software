const nodemailer = require('nodemailer');

/**
 * EmailService handles sending emails via SMTP (Nodemailer)
 * 
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com, smtp.sendgrid.net)
 * - SMTP_PORT: SMTP port (587 for TLS, 465 for SSL)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password or API key
 * - FROM_EMAIL: Sender email address
 * - FROM_NAME: Sender name (optional, defaults to "MaidTrack")
 */
class EmailService {
  static transporter = null;
  
  /**
   * Initialize the email transporter
   */
  static getTransporter() {
    if (this.transporter) return this.transporter;
    
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    
    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️ SMTP not configured. Emails will be logged to console only.');
      return null;
    }
    
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT) || 587,
      secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    
    return this.transporter;
  }
  
  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text body
   * @param {string} options.html - HTML body (optional)
   * @returns {Promise<Object>} Send result
   */
  static async send({ to, subject, text, html }) {
    const fromEmail = process.env.FROM_EMAIL || 'noreply@maidtrack.com';
    const fromName = process.env.FROM_NAME || 'MaidTrack';
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    };
    
    // Log email for debugging
    console.log('='.repeat(60));
    console.log('📧 EMAIL');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(text);
    console.log('='.repeat(60));
    
    const transporter = this.getTransporter();
    
    if (!transporter) {
      // SMTP not configured - just log
      return { success: true, method: 'console', messageId: 'console-' + Date.now() };
    }
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send maid approval email
   */
  static async sendMaidApprovalEmail(maid) {
    const subject = '🎉 Your MaidTrack Account Has Been Approved!';
    
    const text = `Hello ${maid.name},

Great news! Your MaidTrack account has been approved by our admin team.

You can now log in to your account and start receiving job requests from homeowners in your area.

Login Details:
- Email: ${maid.email}
- Password: Use the password you created during registration

Getting Started:
1. Log in to your dashboard at ${process.env.APP_URL || 'https://maidtrack.com'}
2. Complete your profile with your specializations and hourly rate
3. Set your availability to start receiving job requests
4. Turn on "Online" status when you're ready to work

If you have any questions, please contact our support team.

Welcome to MaidTrack!

Best regards,
The MaidTrack Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A374D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2ECC71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .steps { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .steps li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Account Approved!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${maid.name}</strong>,</p>
      <p>Great news! Your MaidTrack account has been approved by our admin team.</p>
      <p>You can now log in and start receiving job requests from homeowners in your area.</p>
      
      <p><strong>Login Details:</strong></p>
      <ul>
        <li>Email: ${maid.email}</li>
        <li>Password: Use the password you created during registration</li>
      </ul>
      
      <center>
        <a href="${process.env.APP_URL || 'https://maidtrack.com'}/login.html" class="button">Log In Now</a>
      </center>
      
      <div class="steps">
        <p><strong>Getting Started:</strong></p>
        <ol>
          <li>Log in to your dashboard</li>
          <li>Complete your profile with specializations and hourly rate</li>
          <li>Set your availability schedule</li>
          <li>Turn on "Online" status when ready to work</li>
        </ol>
      </div>
      
      <p>Welcome to MaidTrack!</p>
      <p>Best regards,<br>The MaidTrack Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MaidTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.send({ to: maid.email, subject, text, html });
  }
  
  /**
   * Send maid rejection email
   */
  static async sendMaidRejectionEmail(maid, reason = '') {
    const subject = 'MaidTrack Account Application Update';
    
    const text = `Hello ${maid.name},

Thank you for your interest in joining MaidTrack.

After reviewing your application, we regret to inform you that we are unable to approve your account at this time.

${reason ? `Reason: ${reason}\n` : ''}
If you believe this was a mistake or would like to provide additional information, please contact our support team.

You may also reapply with updated information.

Best regards,
The MaidTrack Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A374D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .reason { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${maid.name}</strong>,</p>
      <p>Thank you for your interest in joining MaidTrack.</p>
      <p>After reviewing your application, we regret to inform you that we are unable to approve your account at this time.</p>
      
      ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ''}
      
      <p>If you believe this was a mistake or would like to provide additional information, please contact our support team.</p>
      <p>You may also reapply with updated information.</p>
      
      <p>Best regards,<br>The MaidTrack Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MaidTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.send({ to: maid.email, subject, text, html });
  }
  
  /**
   * Send password reset email (for future use)
   */
  static async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.APP_URL || 'https://maidtrack.com'}/reset-password.html?token=${resetToken}`;
    const subject = 'Reset Your MaidTrack Password';
    
    const text = `Hello ${user.name},

You requested to reset your password. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The MaidTrack Team`;

    return this.send({ to: user.email, subject, text });
  }
  
  /**
   * Verify SMTP connection
   */
  static async verifyConnection() {
    const transporter = this.getTransporter();
    if (!transporter) {
      return { configured: false, message: 'SMTP not configured' };
    }
    
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return { configured: true, connected: true, message: 'SMTP connection verified' };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      // Log details without exposing password
      console.error('SMTP Config: host=%s, port=%s, user=%s', 
        process.env.SMTP_HOST, 
        process.env.SMTP_PORT, 
        process.env.SMTP_USER
      );
      return { configured: true, connected: false, message: error.message };
    }
  }
  
  /**
   * Send a test email to verify configuration
   */
  static async sendTestEmail(toEmail) {
    const subject = '✅ MaidTrack Email Test';
    const text = `This is a test email from MaidTrack.

If you received this email, your SMTP configuration is working correctly!

Sent at: ${new Date().toISOString()}
Server: ${process.env.APP_URL || 'localhost'}

Best regards,
MaidTrack System`;

    const result = await this.send({ to: toEmail, subject, text });
    
    if (result.success) {
      console.log(`✅ Test email sent successfully to ${toEmail}`);
    } else {
      console.error(`❌ Test email failed to ${toEmail}:`, result.error);
    }
    
    return result;
  }
  
  /**
   * Get SMTP configuration status (without exposing secrets)
   */
  static getConfigStatus() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;
    return {
      configured: !!(SMTP_HOST && SMTP_USER && SMTP_PASS),
      host: SMTP_HOST || 'not set',
      port: SMTP_PORT || '587 (default)',
      user: SMTP_USER ? `${SMTP_USER.substring(0, 3)}***` : 'not set',
      passSet: !!SMTP_PASS,
      fromEmail: FROM_EMAIL || 'noreply@maidtrack.com'
    };
  }
}

module.exports = EmailService;
