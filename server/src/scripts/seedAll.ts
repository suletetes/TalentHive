#!/usr/bin/env node

/**
 * Comprehensive Seed Runner
 * 
 * This script provides options to run different seeding operations:
 * - Full comprehensive seed (default)
 * - Individual seed operations
 * - New features only
 * - Work logs only
 * 
 * Usage:
 * npm run seed              # Full comprehensive seed
 * npm run seed:new          # New features only
 * npm run seed:worklogs     # Work logs only
 * npm run seed:roles        # Roles and permissions only
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('MongoDB disconnection failed:', error);
  }
}

async function runFullSeed() {
  logger.info('Running full comprehensive seed...');
  const { seedDatabase } = await import('./seed');
  await seedDatabase();
}

async function runNewFeatures() {
  logger.info('Running new features seed only...');
  try {
    await connectDB();
    const { seedNewFeatures } = await import('./seedNewFeatures');
    await seedNewFeatures();
    await disconnectDB();
  } catch (error) {
    logger.error('Error running new features seed:', error);
    await disconnectDB();
    throw error;
  }
}

async function runWorkLogs() {
  logger.info('Running work logs seed only...');
  try {
    await connectDB();
    const seedWorkLogsModule = await import('./seedWorkLogs');
    if (seedWorkLogsModule.seedWorkLogs) {
      await seedWorkLogsModule.seedWorkLogs();
    } else {
      logger.error('seedWorkLogs function not found in seedWorkLogs.ts');
      throw new Error('seedWorkLogs function not exported');
    }
    await disconnectDB();
  } catch (error) {
    logger.error('Error running work logs seed:', error);
    await disconnectDB();
    throw error;
  }
}

async function runRoles() {
  logger.info('Running roles and permissions seed only...');
  try {
    await connectDB();
    const { seedPermissions } = await import('./seedPermissions');
    const { seedRoles } = await import('./seedRoles');
    await seedPermissions();
    await seedRoles();
    await disconnectDB();
  } catch (error) {
    logger.error('Error running roles seed:', error);
    await disconnectDB();
    throw error;
  }
}

async function runCompleteProfiles() {
  logger.info('Running complete profiles seed...');
  try {
    const seedProfilesModule = await import('./seedWithCompleteProfiles');
    if (seedProfilesModule.seedCompleteProfiles) {
      await seedProfilesModule.seedCompleteProfiles();
    } else {
      logger.error('seedCompleteProfiles function not found in seedWithCompleteProfiles.ts');
      throw new Error('seedCompleteProfiles function not exported');
    }
  } catch (error) {
    logger.error('Error running complete profiles seed:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'new':
      case 'new-features':
        await runNewFeatures();
        break;
      case 'worklogs':
      case 'work-logs':
        await runWorkLogs();
        break;
      case 'roles':
      case 'rbac':
        await runRoles();
        break;
      case 'profiles':
      case 'complete-profiles':
        await runCompleteProfiles();
        break;
      case 'full':
      case undefined:
      default:
        await runFullSeed();
        break;
    }
    
    logger.info('Seeding operation completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as runSeedAll };