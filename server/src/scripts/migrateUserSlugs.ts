import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { generateUniqueSlugFromName } from '../utils/slugUtils';

// Load environment variables
dotenv.config();

/**
 * Migration script to generate profile slugs for existing users
 * Run with: npx ts-node server/src/scripts/migrateUserSlugs.ts
 */
async function migrateUserSlugs() {
  try {
    console.log('🔄 Starting user slug migration...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all users without a profile slug
    const usersWithoutSlug = await User.find({
      $or: [
        { profileSlug: { $exists: false } },
        { profileSlug: null },
        { profileSlug: '' },
      ],
    });

    console.log(`📊 Found ${usersWithoutSlug.length} users without profile slugs`);

    if (usersWithoutSlug.length === 0) {
      console.log('✅ All users already have profile slugs!');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate slugs for each user
    for (const user of usersWithoutSlug) {
      try {
        const firstName = user.profile.firstName || 'user';
        const lastName = user.profile.lastName || '';
        
        // Generate unique slug
        const slug = await generateUniqueSlugFromName(firstName, lastName);
        
        // Update user
        user.profileSlug = slug;
        await user.save();

        successCount++;
        console.log(`✅ Generated slug for ${firstName} ${lastName}: ${slug}`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to generate slug for user ${user._id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${usersWithoutSlug.length}`);

    // Verify migration
    const remainingWithoutSlug = await User.countDocuments({
      $or: [
        { profileSlug: { $exists: false } },
        { profileSlug: null },
        { profileSlug: '' },
      ],
    });

    if (remainingWithoutSlug === 0) {
      console.log('\n🎉 Migration completed successfully! All users now have profile slugs.');
    } else {
      console.log(`\n⚠️  Warning: ${remainingWithoutSlug} users still without slugs`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserSlugs()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateUserSlugs;
