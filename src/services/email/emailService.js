const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({  // Fixed: createTransport (not createTransporter)
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationEmail(email, code) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email - Eat Fast',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Eat Fast!</h2>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async send2FACode(email, code) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Your Login Code - Eat Fast',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Login Verification</h2>
          <p>Your login verification code is:</p>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please secure your account immediately.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Password Reset - Eat Fast',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendContactReply(email, name, subject, reply) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Response to Your Inquiry</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting us. Here's our response:</p>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
            ${reply}
          </div>
          <p>Best regards,<br>Eat Fast Support Team</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendOrderConfirmation(email, orderDetails) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Order Confirmation - #${orderDetails.orderNumber}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order. Here are the details:</p>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <h3>Order #${orderDetails.orderNumber}</h3>
            <p><strong>Total:</strong> ${orderDetails.totalAmount} XAF</p>
            <p><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
            <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}</p>
          </div>
          <p>We'll send you updates as your order progresses.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendContactNotification(contact) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL || 'admin@eatfast.com',
      subject: `New Contact Inquiry: ${contact.subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Contact Inquiry</h2>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${contact.message}</p>
          </div>
          <p>Reply to this inquiry in the admin panel.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendNewsletterConfirmation(email, token) {
    const confirmUrl = `${process.env.API_URL}/newsletter/confirm/${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Confirm Your Newsletter Subscription - Eat Fast',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Confirm Your Subscription</h2>
          <p>Thank you for subscribing to Eat Fast newsletter!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Confirm Subscription
            </a>
          </div>
          <p>If you didn't subscribe, please ignore this email.</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendPartnerApplicationConfirmation(email, ownerName, applicationId) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Partner Application Received - Eat Fast',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Application Received</h2>
          <p>Dear ${ownerName},</p>
          <p>Thank you for submitting your restaurant partnership application.</p>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><strong>Status:</strong> Under Review</p>
          </div>
          <p>We'll review your application and get back to you within 3-5 business days.</p>
          <p>Best regards,<br>Eat Fast Team</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendPartnerStatusUpdate(email, ownerName, restaurantName, status, rejectionReason = null) {
    const statusMessages = {
      approved: 'Congratulations! Your application has been approved.',
      rejected: 'We regret to inform you that your application has been rejected.',
      under_review: 'Your application is currently under review.'
    };

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Application ${status.toUpperCase()} - ${restaurantName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Application Status Update</h2>
          <p>Dear ${ownerName},</p>
          <p>${statusMessages[status]}</p>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          </div>
          ${status === 'approved' ? 
            '<p>We will contact you shortly with next steps to set up your restaurant account.</p>' : 
            status === 'rejected' ? 
            '<p>You can reapply after addressing the issues mentioned above.</p>' : 
            '<p>We will update you once the review is complete.</p>'
          }
          <p>Best regards,<br>Eat Fast Team</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendOrderStatusUpdate(email, orderNumber, status) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready for delivery.',
      delivered: 'Your order has been delivered. Enjoy your meal!'
    };

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Order ${status.toUpperCase()} - #${orderNumber}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Status Update</h2>
          <p>${statusMessages[status]}</p>
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <p><strong>Order Number:</strong> #${orderNumber}</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          </div>
          <p>Thank you for choosing Eat Fast!</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();