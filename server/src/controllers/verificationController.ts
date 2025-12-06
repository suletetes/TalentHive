import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { sendEmail } from '../utils/email.resend';
import { AuthRequest } from '../middleware/auth';

export const verificationController = {
  // Send verification email
  sendVerificationEmail: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already verified',
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Set token and expiry (24 hours)
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      // Create verification URL
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - TalentHive',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
            <p>Hi ${user.profile.firstName},</p>
            <p>Thank you for signing up with TalentHive! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with TalentHive, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              TalentHive - Connecting Talent with Opportunity<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        `,
      });

      res.json({
        status: 'success',
        message: 'Verification email sent successfully',
      });
    } catch (error: any) {
      console.error('Send verification email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email',
        error: error.message,
      });
    }
  },

  // Verify email with token
  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Verification token is required',
        });
      }

      // Find user with valid token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification token',
        });
      }

      // Update user verification status
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Send welcome email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to TalentHive!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Welcome to TalentHive! 🎉</h2>
            <p>Hi ${user.profile.firstName},</p>
            <p>Your email has been successfully verified! You now have full access to all TalentHive features.</p>
            <h3>What's Next?</h3>
            <ul>
              ${user.role === 'freelancer' ? `
                <li>Complete your freelancer profile</li>
                <li>Add your skills and portfolio</li>
                <li>Browse available projects</li>
                <li>Submit proposals to clients</li>
              ` : user.role === 'client' ? `
                <li>Post your first project</li>
                <li>Browse talented freelancers</li>
                <li>Review proposals</li>
                <li>Hire the perfect freelancer</li>
              ` : `
                <li>Explore the platform</li>
                <li>Manage users and projects</li>
                <li>Monitor platform activity</li>
              `}
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              TalentHive - Connecting Talent with Opportunity<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        `,
      });

      res.json({
        status: 'success',
        message: 'Email verified successfully',
        data: {
          isVerified: true,
        },
      });
    } catch (error: any) {
      console.error('Verify email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify email',
        error: error.message,
      });
    }
  },

  // Resend verification email
  resendVerificationEmail: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already verified',
        });
      }

      // Check if a verification email was sent recently (within 5 minutes)
      if (user.emailVerificationExpires && user.emailVerificationExpires > new Date(Date.now() + 23.92 * 60 * 60 * 1000)) {
        return res.status(429).json({
          status: 'error',
          message: 'Please wait a few minutes before requesting another verification email',
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Set token and expiry (24 hours)
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      // Create verification URL
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - TalentHive',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
            <p>Hi ${user.profile.firstName},</p>
            <p>You requested a new verification email. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              TalentHive - Connecting Talent with Opportunity<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        `,
      });

      res.json({
        status: 'success',
        message: 'Verification email sent successfully',
      });
    } catch (error: any) {
      console.error('Resend verification email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to resend verification email',
        error: error.message,
      });
    }
  },

  // Check verification status
  checkVerificationStatus: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;

      const user = await User.findById(userId).select('isVerified email');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      res.json({
        status: 'success',
        data: {
          isVerified: user.isVerified,
          email: user.email,
        },
      });
    } catch (error: any) {
      console.error('Check verification status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check verification status',
        error: error.message,
      });
    }
  },
};
