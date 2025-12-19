import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock window.alert
global.alert = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: undefined,
  };

  return {
    default: vi.fn(() => mockSocket),
    io: vi.fn(() => mockSocket),
  };
});

// Global test cleanup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset window.confirm to default behavior
  global.confirm = vi.fn(() => true);
  
  // Reset window.alert
  global.alert = vi.fn();
});

afterEach(() => {
  // Clean up DOM after each test
  cleanup();
  
  // Clear all timers
  vi.clearAllTimers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset modules to ensure clean state
  vi.resetModules();
});