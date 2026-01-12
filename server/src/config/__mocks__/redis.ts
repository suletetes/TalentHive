// Mock Redis for testing
export const getRedisClient = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  flushDb: jest.fn(),
  keys: jest.fn(),
  isOpen: false,
  quit: jest.fn(),
}));

export const setCache = jest.fn().mockResolvedValue(undefined);
export const getCache = jest.fn().mockResolvedValue(null);
export const deleteCache = jest.fn().mockResolvedValue(undefined);
export const clearCache = jest.fn().mockResolvedValue(undefined);
export const connectRedis = jest.fn().mockResolvedValue(undefined);
