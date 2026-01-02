import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

// Use relative imports for seed scripts
import { logger } from '../utils/logger';
import '../models/User'; // Register User model for population
import { Contract } from '../models/Contract';
import WorkLog from '../models/WorkLog';

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    await mongoose.connect(mongoUri);
    logger.info(' Connected to MongoDB');
  } catch (error) {
    logger.error(' MongoDB connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info(' Disconnected from MongoDB');
  } catch (error) {
    logger.error(' MongoDB disconnection failed:', error);
  }
}

function getRandomTime(minHour: number, maxHour: number): string {
  const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  let newHour = h + hours;
  if (newHour >= 24) newHour -= 24;
  return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const workDescriptions = [
  'Implemented new feature components',
  'Fixed bugs in the authentication flow',
  'Code review and refactoring',
  'Database optimization and indexing',
  'API endpoint development',
  'Frontend UI improvements',
  'Testing and debugging',
  'Documentation updates',
  'Performance optimization',
  'Integration with third-party services',
  'Security audit and fixes',
  'Responsive design implementation',
  'Backend service development',
  'Data migration scripts',
  'Unit test coverage improvement',
  'Client meeting and requirements gathering',
  'Sprint planning and task breakdown',
  'Bug fixes and hotfixes',
  'Code deployment and monitoring',
  'Database schema updates',
];

async function seedWorkLogs() {
  try {
    await connectDB();

    logger.info(' Seeding work logs...');

    // Clear existing work logs
    await WorkLog.deleteMany({});
    logger.info(' Cleared existing work logs');

    // Get active contracts with populated data
    const activeContracts = await Contract.find({ status: 'active' })
      .populate('freelancer', '_id profile.firstName profile.lastName')
      .populate('client', '_id')
      .limit(15);

    if (activeContracts.length === 0) {
      logger.warn(' No active contracts found. Please seed contracts first.');
      await disconnectDB();
      return;
    }

    logger.info(` Found ${activeContracts.length} active contracts`);

    const workLogs: any[] = [];
    const today = new Date();

    for (const contract of activeContracts) {
      // Create 8-15 work logs per contract over the last 60 days for better reports
      const numLogs = Math.floor(Math.random() * 8) + 8;

      for (let i = 0; i < numLogs; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const logDate = new Date(today);
        logDate.setDate(logDate.getDate() - daysAgo);
        logDate.setHours(0, 0, 0, 0);

        const startTime = getRandomTime(8, 16); // Start between 8am and 4pm
        const workHours = Math.floor(Math.random() * 5) + 1; // 1-5 hours
        const endTime = addHours(startTime, workHours);

        const description = workDescriptions[Math.floor(Math.random() * workDescriptions.length)];

        workLogs.push({
          freelancer: contract.freelancer,
          contract: contract._id,
          startDate: logDate,
          startTime,
          endDate: logDate,
          endTime,
          duration: workHours * 60, // in minutes
          description,
          status: 'completed',
        });
      }

      // Add one in-progress log for some contracts (30% chance)
      if (Math.random() > 0.7) {
        const startTime = getRandomTime(9, 11);
        workLogs.push({
          freelancer: contract.freelancer,
          contract: contract._id,
          startDate: today,
          startTime,
          description: 'Currently working on assigned tasks',
          status: 'in_progress',
        });
      }
    }

    // Insert all work logs
    await WorkLog.insertMany(workLogs);
    logger.info(` Created ${workLogs.length} work logs`);

    // Calculate totals for summary
    const completedCount = workLogs.filter((l) => l.status === 'completed').length;
    const inProgressCount = workLogs.filter((l) => l.status === 'in_progress').length;
    const totalMinutes = workLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    logger.info(` Summary:`);
    logger.info(`   - ${completedCount} completed logs`);
    logger.info(`   - ${inProgressCount} in-progress logs`);
    logger.info(`   - ${totalHours} total hours logged`);
    logger.info(`   - ${activeContracts.length} contracts with work logs`);

    logger.info(' Work log seeding finished successfully!');
    await disconnectDB();
  } catch (error) {
    logger.error(' Error during seeding:', error);
    await disconnectDB();
    process.exit(1);
  }
}

// Run the seed
seedWorkLogs();
