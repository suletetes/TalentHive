import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';

export const connectDB = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    await mongoose.connect(MONGODB_URI, options);
    
    logger.info(`📦 MongoDB connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
});

process.on('SIGTERM', async () => {
  await disconnectDB();
});