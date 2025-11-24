import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { Project } from '@/models/Project';
import { Category } from '@/models/Category';

dotenv.config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB disconnection failed:', error);
  }
}

async function fixCategoryIds() {
  try {
    logger.info('🔧 Starting category ID fix...');

    // Get all categories
    const categories = await Category.find();
    logger.info(`📊 Found ${categories.length} categories`);

    // Create a map of category IDs to names
    const categoryMap = new Map<string, string>();
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat.name);
    });

    // Find all projects with category as ObjectId
    const projects = await Project.find();
    logger.info(`📋 Found ${projects.length} projects to check`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const project of projects) {
      const categoryValue = project.category;

      // Check if category is an ObjectId (24 hex characters)
      if (categoryValue && typeof categoryValue === 'string' && /^[0-9a-f]{24}$/i.test(categoryValue)) {
        // This is an ObjectId, convert it to category name
        const categoryName = categoryMap.get(categoryValue);
        if (categoryName) {
          logger.info(`🔄 Fixing project "${project.title}": ${categoryValue} → ${categoryName}`);
          project.category = categoryName;
          await project.save();
          fixedCount++;
        } else {
          logger.warn(`⚠️ Category ID not found: ${categoryValue} for project "${project.title}"`);
        }
      } else {
        // Already a string name or empty
        alreadyCorrectCount++;
      }
    }

    logger.info(`✅ Fix complete!`);
    logger.info(`📊 Summary:`);
    logger.info(`   - Fixed: ${fixedCount} projects`);
    logger.info(`   - Already correct: ${alreadyCorrectCount} projects`);
    logger.info(`   - Total: ${fixedCount + alreadyCorrectCount} projects`);

  } catch (error) {
    logger.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run if executed directly
if (require.main === module) {
  fixCategoryIds();
}

export { fixCategoryIds };
