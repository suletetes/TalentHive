// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables before starting the application
import { validateEnvironmentVariables } from '@/utils/validateEnv';
validateEnvironmentVariables();

import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { socketService } from '@/services/socket.service';
import routes from '@/routes';

// Import new security and performance middleware
import { 
  apiRateLimiter, 
  sanitizeInput, 
  securityHeaders, 
  corsOptions, 
  validateRequest, 
  trackIP 
} from '@/middleware/security';
import { 
  requestTimer, 
  compressionCheck, 
  monitorMemory,
  noCache 
} from '@/middleware/performance';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Initialize socket service
socketService.setIO(io);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(securityHeaders());
app.use(cors(corsOptions));
app.use(trackIP);
app.use(sanitizeInput());
app.use(validateRequest);

// Performance middleware
app.use(requestTimer);
app.use(compression());
app.use(compressionCheck);

// Logging middleware - skip frequent polling endpoints
const skipPolling = (req: any) => {
  return req.url.includes('/unread-count') || 
         req.url.includes('/conversations') && req.method === 'GET';
};

if (NODE_ENV === 'development') {
  app.use(morgan('dev', { skip: skipPolling }));
} else {
  app.use(morgan('combined', { skip: skipPolling }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes (v1)
app.use('/api/v1', routes);
// Also support /api for backward compatibility
app.use('/api', routes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();
    
    // Start memory monitoring
    monitorMemory();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`  Health check available at http://localhost:${PORT}/health`);
      logger.info(`🔗 API available at http://localhost:${PORT}/api`);
      logger.info(`🔒 Security middleware active`);
      logger.info(`⚡ Performance monitoring enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export { app, io };

// Start server if not in test environment
if (NODE_ENV !== 'test') {
  startServer();
}