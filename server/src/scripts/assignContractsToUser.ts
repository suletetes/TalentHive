/**
 * Script to assign existing contracts to a specific user
 * Run with: npm run assign-contracts -- --email=your@email.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import '../models/Contract';
import '../models/User';

const Contract = mongoose.model('Contract');
const User = mongoose.model('User');

async function assignContractsToUser() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive');
    console.log('✅ Connected to MongoDB');

    // Get email from command line arguments
    const args = process.argv.slice(2);
    const emailArg = args.find(arg => arg.startsWith('--email='));
    
    if (!emailArg) {
      console.log('❌ Please provide email: npm run assign-contracts -- --email=your@email.com');
      process.exit(1);
    }
    
    const email = emailArg.split('=')[1];
    console.log(`🔍 Looking for user: ${email}`);

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.profile?.firstName} ${user.profile?.lastName} (${user.role})`);

    // Get some existing contracts
    const existingContracts = await Contract.find().limit(5).populate('client freelancer');
    
    if (existingContracts.length === 0) {
      console.log('❌ No contracts found in database');
      process.exit(1);
    }

    console.log(`📋 Found ${existingContracts.length} existing contracts`);

    // Assign contracts based on user role
    let updatedCount = 0;
    
    for (const contract of existingContracts) {
      if (user.role === 'client') {
        // Assign as client
        await Contract.findByIdAndUpdate(contract._id, { client: user._id });
        console.log(`✅ Assigned contract "${contract.title}" to ${email} as client`);
        updatedCount++;
      } else if (user.role === 'freelancer') {
        // Assign as freelancer
        await Contract.findByIdAndUpdate(contract._id, { freelancer: user._id });
        console.log(`✅ Assigned contract "${contract.title}" to ${email} as freelancer`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Successfully assigned ${updatedCount} contracts to ${email}`);
    console.log('💡 Now refresh your contracts page to see them!');

  } catch (error) {
    console.error('❌ Error assigning contracts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
assignContractsToUser().catch(console.error);