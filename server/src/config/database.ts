import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    // Skip if already connected (important for tests)
    if (mongoose.connection.readyState === 1) {
      logger.info('MongoDB already connected, skipping connection');
      return;
    }

    // Skip if connecting (readyState === 2)
    if (mongoose.connection.readyState === 2) {
      logger.info('MongoDB connection in progress, waiting...');
      // Wait for connection to complete with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout after 30 seconds'));
        }, 30000); // 30 second timeout

        const onConnected = () => {
          clearTimeout(timeout);
          mongoose.connection.off('error', onError);
          resolve(void 0);
        };

        const onError = (error: Error) => {
          clearTimeout(timeout);
          mongoose.connection.off('connected', onConnected);
          reject(error);
        };

        mongoose.connection.once('connected', onConnected);
        mongoose.connection.once('error', onError);
      });
      return;
    }
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    
    await mongoose.connect(mongoUri, {
      // Remove deprecated options
    });
    
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected');
  } catch (error) {
    logger.error('❌ MongoDB disconnection error:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});