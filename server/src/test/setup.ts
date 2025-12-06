import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Redis before any imports that use it
jest.mock('@/config/redis');

// Load environment variables
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.SENDGRID_API_KEY = 'SG.test-api-key-for-testing';
process.env.FROM_EMAIL = 'test@talenthive.com';
process.env.FROM_NAME = 'TalentHive Test';

let mongoServer: MongoMemoryServer;
let redisClient: any;

// Setup test database before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Don't actually connect to Redis in tests - it's mocked
  redisClient = null;
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
});