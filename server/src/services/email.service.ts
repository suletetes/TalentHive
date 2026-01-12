import sgMail from '@sendgrid/mail';
import { logger } from '@/utils/logger';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not configured. Email functionality will be disabled.');
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

class EmailService {
  private fromEmail: string;
  private fromName: string;
  private maxRetries: number;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@talenthive.com';
    this.fromName = process.env.FROM_NAME || 'TalentHive Platform';
    this.maxRetries = 3;
  }

  /**
   * Send email with retry logic
   */
  private async sendWithRetry(mailOptions: any, retries = 0): Promise<void> {
    try {
      await sgMail.send(mailOptions);
      logger.info(`Email sent successfully to ${mailOptions.to}`);
    } catch (error: any) {
      logger.error(`Email send failed (attempt ${retries + 1}/${this.maxRetries}):`, error);
      
      if (retries < this.maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(mailOptions, retries + 1);
      }
      
      throw new Error(`Failed to send email after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('SendGrid not configured. Skipping email send.');
      return;
    }

    const mailOptions: any = {
      to: options.to,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: options.subject,
    };

    if (options.templateId) {
      mailOptions.templateId = options.templateId;
      mailOptions.dynamicTemplateData = options.dynamicTemplateData || {};
    } else {
      mailOptions.text = options.text;
      mailOptions.html = options.html;
    }

    await this.sendWithRetry(mailOptions);
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name: string, verificationToken?: string): Promise<void> {
    const verificationUrl = verificationToken
      ? `${process.env.CLIENT_URL}/verify-email/${verificationToken}`
      : null;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to TalentHive!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining TalentHive, the premier platform connecting talented freelancers with clients worldwide.</p>
        ${verificationUrl ? `
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>
          ${verificationUrl}</p>
        ` : ''}
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to TalentHive!',
      html,
      text: `Welcome to TalentHive! ${verificationUrl ? `Verify your email: ${verificationUrl}` : ''}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your TalentHive account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>
        ${resetUrl}</p>
        <p style="color: #dc2626; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - TalentHive',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  /**
   * Send proposal notification to project owner
   */
  async sendProposalNotification(
    clientEmail: string,
    clientName: string,
    freelancerName: string,
    projectTitle: string,
    proposalId: string
  ): Promise<void> {
    const proposalUrl = `${process.env.CLIENT_URL}/dashboard/projects/${proposalId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Proposal Received!</h1>
        <p>Hi ${clientName},</p>
        <p>Great news! You've received a new proposal for your project "<strong>${projectTitle}</strong>".</p>
        <p><strong>Freelancer:</strong> ${freelancerName}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${proposalUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Proposal
          </a>
        </div>
        <p>Review the proposal and connect with the freelancer to discuss your project.</p>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: clientEmail,
      subject: `New Proposal for "${projectTitle}"`,
      html,
      text: `You received a new proposal from ${freelancerName} for "${projectTitle}". View it at: ${proposalUrl}`,
    });
  }

  /**
   * Send contract notification
   */
  async sendContractNotification(
    recipientEmail: string,
    recipientName: string,
    contractTitle: string,
    contractId: string,
    isClient: boolean
  ): Promise<void> {
    const contractUrl = `${process.env.CLIENT_URL}/dashboard/contracts/${contractId}`;
    const role = isClient ? 'client' : 'freelancer';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Contract Created</h1>
        <p>Hi ${recipientName},</p>
        <p>A new contract has been created for "<strong>${contractTitle}</strong>".</p>
        <p>As the ${role}, please review and sign the contract to begin work.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${contractUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Contract
          </a>
        </div>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `New Contract: ${contractTitle}`,
      html,
      text: `A new contract has been created for "${contractTitle}". View it at: ${contractUrl}`,
    });
  }

  /**
   * Send milestone completion notification
   */
  async sendMilestoneNotification(
    recipientEmail: string,
    recipientName: string,
    milestoneTitle: string,
    contractTitle: string,
    contractId: string,
    isClient: boolean
  ): Promise<void> {
    const contractUrl = `${process.env.CLIENT_URL}/dashboard/contracts/${contractId}`;
    const message = isClient
      ? 'A milestone has been submitted for your review.'
      : 'Your milestone has been approved!';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Milestone Update</h1>
        <p>Hi ${recipientName},</p>
        <p>${message}</p>
        <p><strong>Contract:</strong> ${contractTitle}</p>
        <p><strong>Milestone:</strong> ${milestoneTitle}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${contractUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Contract
          </a>
        </div>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `Milestone Update: ${milestoneTitle}`,
      html,
      text: `${message} Contract: ${contractTitle}, Milestone: ${milestoneTitle}. View at: ${contractUrl}`,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    recipientEmail: string,
    recipientName: string,
    amount: number,
    contractTitle: string,
    isClient: boolean
  ): Promise<void> {
    const message = isClient
      ? `Your payment of $${amount.toFixed(2)} has been processed for "${contractTitle}".`
      : `You've received a payment of $${amount.toFixed(2)} for "${contractTitle}".`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Payment ${isClient ? 'Processed' : 'Received'}</h1>
        <p>Hi ${recipientName},</p>
        <p>${message}</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p style="margin: 10px 0 0 0;"><strong>Contract:</strong> ${contractTitle}</p>
        </div>
        <p>You can view your payment history in your dashboard.</p>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `Payment ${isClient ? 'Processed' : 'Received'} - $${amount.toFixed(2)}`,
      html,
      text: message,
    });
  }

  /**
   * Send message notification
   */
  async sendMessageNotification(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    const messagesUrl = `${process.env.CLIENT_URL}/dashboard/messages`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Message</h1>
        <p>Hi ${recipientName},</p>
        <p>You have a new message from <strong>${senderName}</strong>:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <p style="margin: 0;">${messagePreview}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${messagesUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Message
          </a>
        </div>
        <p>Best regards,<br>The TalentHive Team</p>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName}`,
      html,
      text: `You have a new message from ${senderName}: ${messagePreview}. View at: ${messagesUrl}`,
    });
  }
}

export const emailService = new EmailService();
