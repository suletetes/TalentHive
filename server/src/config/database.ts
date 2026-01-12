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
      // Connection pool settings
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'), // Maximum number of connections
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),  // Minimum number of connections
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'), // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'), // How long to try selecting a server
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'), // How long a send or receive on a socket can take before timing out
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000'), // How long to wait for a connection to be established
      
      // Heartbeat settings
      heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY || '10000'), // How often to check server status
      
      // Buffer settings (these are mongoose-specific, not MongoDB driver options)
      // bufferMaxEntries: 0, // Disable mongoose buffering - removed as not valid in ConnectOptions
      // bufferCommands: false, // Disable mongoose buffering - removed as not valid in ConnectOptions
      
      // Retry settings
      retryWrites: true, // Enable retryable writes
      retryReads: true,  // Enable retryable reads
      
      // Compression
      compressors: ['zlib'], // Enable compression
      zlibCompressionLevel: 6, // Compression level (1-9)
    });
    
    logger.info(`  MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('  MongoDB connection error:', error);
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
    logger.info('  MongoDB disconnected');
  } catch (error) {
    logger.error('  MongoDB disconnection error:', error);
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