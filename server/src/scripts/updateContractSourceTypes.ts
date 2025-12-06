import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { Contract } from '@/models/Contract';
import { HireNowRequest } from '@/models/HireNowRequest';

// Load environment variables
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

async function updateContractSourceTypes() {
  logger.info('🔄 Updating contract source types...');
  
  // Get all contracts without sourceType
  const contracts = await Contract.find({
    $or: [
      { sourceType: { $exists: false } },
      { sourceType: null }
    ]
  });
  
  logger.info(`Found ${contracts.length} contracts without sourceType`);
  
  let proposalCount = 0;
  let hireNowCount = 0;
  let serviceCount = 0;
  
  for (const contract of contracts) {
    // Check if this contract is from a hire now request
    const hireNowRequest = await HireNowRequest.findOne({
      $or: [
        { client: contract.client, freelancer: contract.freelancer },
        { 'project': contract.project }
      ]
    });
    
    if (hireNowRequest) {
      contract.sourceType = 'hire_now';
      hireNowCount++;
    } else if ((contract as any).servicePackage) {
      contract.sourceType = 'service';
      serviceCount++;
    } else {
      contract.sourceType = 'proposal';
      proposalCount++;
    }
    
    await contract.save();
  }
  
  logger.info(`✅ Updated ${contracts.length} contracts:`);
  logger.info(`   - Proposal: ${proposalCount}`);
  logger.info(`   - Hire Now: ${hireNowCount}`);
  logger.info(`   - Service: ${serviceCount}`);
}

async function main() {
  try {
    await connectDB();
    await updateContractSourceTypes();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Script failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

main();
