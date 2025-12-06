import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { User } from '@/models/User';
import { Review } from '@/models/Review';
import { generateCompleteFreelancerProfiles, generateReviewsForFreelancers } from './completeProfileSeed';

dotenv.config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB disconnection failed:', error);
  }
}

async function seedCompleteProfiles() {
  try {
    await connectDB();

    logger.info('🔄 Updating freelancer profiles with complete data...');

    // Get complete freelancer profiles
    const completeProfiles = await generateCompleteFreelancerProfiles();

    // Update or create freelancers with complete profiles
    const createdFreelancers = [];
    for (const profile of completeProfiles) {
      const existingUser = await User.findOne({ email: profile.email });
      
      if (existingUser) {
        // Update existing user with complete profile
        await User.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              profile: profile.profile,
              freelancerProfile: profile.freelancerProfile,
              rating: profile.rating,
            },
          }
        );
        logger.info(`✅ Updated freelancer: ${profile.profile.firstName} ${profile.profile.lastName}`);
        createdFreelancers.push(existingUser._id);
      } else {
        // Create new freelancer
        const newUser = await User.create(profile);
        logger.info(`✅ Created freelancer: ${profile.profile.firstName} ${profile.profile.lastName}`);
        createdFreelancers.push(newUser._id);
      }
    }

    // Reviews are already created by main seed script
    logger.info('✅ Reviews already seeded by main seed script');
    logger.info('🎉 Complete profile seeding finished successfully!');

    await disconnectDB();
  } catch (error) {
    logger.error('❌ Error during seeding:', error);
    await disconnectDB();
    process.exit(1);
  }
}

// Run the seed
seedCompleteProfiles();
