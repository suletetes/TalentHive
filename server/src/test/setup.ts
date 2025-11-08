import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.SENDGRID_API_KEY = 'SG.test-api-key-for-testing';

let mongoServer: MongoMemoryServer;
let redisClient: any;

// Setup test database before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  // Setup test Redis client (you might want to use redis-mock for testing)
  redisClient = createClient({
    socket: {
      host: 'localhost',
      port: 6380, // Different port for testing
    },
  });
  
  // Mock Redis for tests if not available
  if (process.env.NODE_ENV === 'test') {
    jest.mock('@/config/redis', () => ({
      getRedisClient: () => ({
        get: jest.fn(),
        set: jest.fn(),
        setEx: jest.fn(),
        del: jest.fn(),
        flushDb: jest.fn(),
        keys: jest.fn(),
      }),
      setCache: jest.fn(),
      getCache: jest.fn(),
      deleteCache: jest.fn(),
      clearCache: jest.fn(),
    }));
  }
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
  
  if (redisClient) {
    await redisClient.quit();
  }
});