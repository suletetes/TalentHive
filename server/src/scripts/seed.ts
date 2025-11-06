import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '@/config/database';
import { logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // TODO: Add seed data creation here
    // This will be implemented when we create the data models
    
    logger.info('✅ Database seeding completed successfully');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };