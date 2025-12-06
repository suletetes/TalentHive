import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { User } from '@/models/User';
import { Review } from '@/models/Review';

// Load environment variables
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

async function recalculateRatings() {
  logger.info('📊 Recalculating user ratings from reviews...');
  
  // Get all users
  const users = await User.find({});
  logger.info(`Found ${users.length} users to process`);
  
  let updatedCount = 0;
  
  for (const user of users) {
    // Get all reviews where this user is the reviewee
    const reviews = await Review.find({ reviewee: user._id });
    
    if (reviews.length > 0) {
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      // Update user rating
      user.rating = {
        average: averageRating,
        count: reviews.length,
      };
      
      await user.save();
      updatedCount++;
      
      logger.info(
        `✅ Updated ${user.profile.firstName} ${user.profile.lastName}: ` +
        `${averageRating.toFixed(2)} (${reviews.length} reviews)`
      );
    } else {
      // Reset rating if no reviews
      if (user.rating.count > 0 || user.rating.average > 0) {
        user.rating = {
          average: 0,
          count: 0,
        };
        await user.save();
        logger.info(
          `🔄 Reset ${user.profile.firstName} ${user.profile.lastName}: ` +
          `0.0 (0 reviews)`
        );
      }
    }
  }
  
  logger.info(`✅ Recalculation complete! Updated ${updatedCount} users with reviews`);
}

async function main() {
  try {
    await connectDB();
    await recalculateRatings();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Script failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

main();
