import sgMail from '@sendgrid/mail';
import { logger } from './logger';
import { getValidBusinessUrl } from './stripeTestData';

// Only set API key if it exists
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
      logger.warn('SendGrid not configured, skipping email send');
      console.log(`[EMAIL SKIPPED] To: ${options.to}, Subject: ${options.subject}`);
      return;
    }

    const msg = {
      to: options.to,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'TalentHive',
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await sgMail.send(msg);
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${getValidBusinessUrl()}/verify-email/${token}`;
  
  const html = `
    <h1>Welcome to TalentHive!</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
    <p>If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - TalentHive',
    html,
    text: `Please verify your email by visiting: ${verificationUrl}`,
  });
};