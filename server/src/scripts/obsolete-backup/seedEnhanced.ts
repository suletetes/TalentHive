import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { User } from '@/models/User';
import { Contract } from '@/models/Contract';
import { Review } from '@/models/Review';

// Load environment variables
dotenv.config();

/**
 * Enhanced Seed Script
 * - Adds slugs to users
 * - Marks some contracts as completed
 * - Adds profile viewers
 * - Ensures reviews exist
 */

async function enhanceSeedData(skipConnection = false) {
  try {
    if (!skipConnection) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
      await mongoose.connect(mongoUri);
      logger.info(' Connected to MongoDB');
    }

    // 1. Add slugs to users
    logger.info(' Adding slugs to users...');
    const users = await User.find({});
    let slugCount = 0;
    
    for (const user of users) {
      if (!user.profileSlug) {
        const firstName = user.profile?.firstName || 'user';
        const lastName = user.profile?.lastName || '';
        const baseSlug = `${firstName.toLowerCase()}${lastName ? '-' + lastName.toLowerCase() : ''}`;
        
        // Check if slug exists, if so add number
        let slug = baseSlug;
        let counter = 1;
        while (await User.findOne({ profileSlug: slug })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        user.profileSlug = slug;
        await user.save();
        slugCount++;
        logger.info(`  Added slug "${slug}" to ${user.email}`);
      }
    }
    logger.info(` Added ${slugCount} slugs`);

    // 2. Mark some contracts as completed and add amounts
    logger.info(' Updating contracts to completed status...');
    
    // Get Alice and other freelancers to ensure they have completed contracts
    const aliceUser = await User.findOne({ email: 'alice.dev@example.com' });
    const bobUser = await User.findOne({ email: 'bob.designer@example.com' });
    const carolUser = await User.findOne({ email: 'carol.writer@example.com' });
    
    const freelancerIds = [aliceUser?._id, bobUser?._id, carolUser?._id].filter(Boolean);
    
    // Find active contracts for these freelancers
    const contracts = await Contract.find({ 
      status: 'active',
      freelancer: { $in: freelancerIds }
    }).limit(20);
    
    let completedCount = 0;
    
    for (const contract of contracts) {
      contract.status = 'completed';
      contract.endDate = new Date();
      
      // Ensure totalAmount exists
      if (!contract.totalAmount || contract.totalAmount === 0) {
        contract.totalAmount = Math.floor(Math.random() * 5000) + 1000; // $1000-$6000
      }
      
      await contract.save();
      completedCount++;
      
      logger.info(`  Completed contract for freelancer ${contract.freelancer}: $${contract.totalAmount}`);
    }
    logger.info(` Marked ${completedCount} contracts as completed`);

    // 3. Add profile viewers
    logger.info(' Adding profile viewers...');
    
    // Prioritize main users (Alice, Bob, Carol, John, Sarah)
    const mainFreelancers = await User.find({ 
      email: { $in: ['alice.dev@example.com', 'bob.designer@example.com', 'carol.writer@example.com'] }
    });
    const mainClients = await User.find({ 
      email: { $in: ['john.client@example.com', 'sarah.manager@example.com'] }
    });
    
    // Get additional users
    const otherFreelancers = await User.find({ 
      role: 'freelancer',
      email: { $nin: ['alice.dev@example.com', 'bob.designer@example.com', 'carol.writer@example.com'] }
    }).limit(7);
    
    const otherClients = await User.find({ 
      role: 'client',
      email: { $nin: ['john.client@example.com', 'sarah.manager@example.com'] }
    }).limit(8);
    
    const freelancers = [...mainFreelancers, ...otherFreelancers];
    const clients = [...mainClients, ...otherClients];
    
    let viewCount = 0;
    
    // Clients view freelancers
    for (const client of clients) {
      for (let i = 0; i < Math.min(3, freelancers.length); i++) {
        const freelancer = freelancers[i];
        
        // Check if viewer already exists
        const alreadyViewed = freelancer.profileViewers?.some(
          (v: any) => v.viewerId.toString() === client._id.toString()
        );
        
        if (!alreadyViewed) {
          if (!freelancer.profileViewers) {
            freelancer.profileViewers = [];
          }
          
          freelancer.profileViewers.push({
            viewerId: client._id,
            viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          } as any);
          
          freelancer.profileViews = (freelancer.profileViews || 0) + 1;
          await freelancer.save();
          viewCount++;
        }
      }
    }
    
    // Freelancers view clients
    for (const freelancer of freelancers) {
      for (let i = 0; i < Math.min(2, clients.length); i++) {
        const client = clients[i];
        
        const alreadyViewed = client.profileViewers?.some(
          (v: any) => v.viewerId.toString() === freelancer._id.toString()
        );
        
        if (!alreadyViewed) {
          if (!client.profileViewers) {
            client.profileViewers = [];
          }
          
          client.profileViewers.push({
            viewerId: freelancer._id,
            viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          } as any);
          
          client.profileViews = (client.profileViews || 0) + 1;
          await client.save();
          viewCount++;
        }
      }
    }
    logger.info(` Added ${viewCount} profile views`);

    // 4. Verify reviews exist
    logger.info(' Checking reviews...');
    const reviewCount = await Review.countDocuments();
    logger.info(` Found ${reviewCount} reviews in database`);

    // Summary
    logger.info('\n Enhancement Summary:');
    logger.info(`  - Slugs added: ${slugCount}`);
    logger.info(`  - Contracts completed: ${completedCount}`);
    logger.info(`  - Profile views added: ${viewCount}`);
    logger.info(`  - Total reviews: ${reviewCount}`);

    if (!skipConnection) {
      await mongoose.disconnect();
      logger.info('\n Database enhancement completed successfully!');
    }
    
  } catch (error) {
    logger.error(' Enhancement failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  enhanceSeedData()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

export { enhanceSeedData };
