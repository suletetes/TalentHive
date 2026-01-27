/**
 * Debug script to check user contracts and IDs
 * Run with: npm run debug-user -- --email=alice.dev@example.com
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

async function debugUserContracts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive');
    console.log('  Connected to MongoDB');

    // Get email from command line arguments
    const args = process.argv.slice(2);
    const emailArg = args.find(arg => arg.startsWith('--email='));
    
    if (!emailArg) {
      console.log('  Please provide email: npm run debug-user -- --email=your@email.com');
      process.exit(1);
    }
    
    const email = emailArg.split('=')[1];
    console.log(`  Looking for user: ${email}`);

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`  User not found: ${email}`);
      process.exit(1);
    }

    console.log(`  Found user:`, {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: `${user.profile?.firstName} ${user.profile?.lastName}`
    });

    // Check contracts where user is client
    console.log('\n  Checking contracts where user is CLIENT...');
    const clientContracts = await Contract.find({ client: user._id })
      .populate('freelancer', 'email profile')
      .lean();
    
    console.log(`   Found ${clientContracts.length} contracts as client:`);
    clientContracts.forEach((contract, index) => {
      console.log(`  ${index + 1}. ${contract.title}`);
      console.log(`     ID: ${contract._id}`);
      console.log(`     Status: ${contract.status}`);
      console.log(`     Client ID: ${contract.client}`);
      console.log(`     Freelancer: ${(contract.freelancer as any)?.email}`);
      console.log('');
    });

    // Check contracts where user is freelancer
    console.log('\n  Checking contracts where user is FREELANCER...');
    const freelancerContracts = await Contract.find({ freelancer: user._id })
      .populate('client', 'email profile')
      .lean();
    
    console.log(`   Found ${freelancerContracts.length} contracts as freelancer:`);
    freelancerContracts.forEach((contract, index) => {
      console.log(`  ${index + 1}. ${contract.title}`);
      console.log(`     ID: ${contract._id}`);
      console.log(`     Status: ${contract.status}`);
      console.log(`     Freelancer ID: ${contract.freelancer}`);
      console.log(`     Client: ${(contract.client as any)?.email}`);
      console.log('');
    });

    // Check all contracts with $or query (like the API does)
    console.log('\n  Checking contracts with $or query (like API)...');
    const allUserContracts = await Contract.find({
      $or: [
        { client: user._id },
        { freelancer: user._id }
      ]
    }).populate('client freelancer', 'email profile').lean();

    console.log(`   Found ${allUserContracts.length} total contracts for user:`);
    allUserContracts.forEach((contract, index) => {
      console.log(`  ${index + 1}. ${contract.title}`);
      console.log(`     ID: ${contract._id}`);
      console.log(`     Status: ${contract.status}`);
      console.log(`     Client: ${(contract.client as any)?.email} (ID: ${contract.client})`);
      console.log(`     Freelancer: ${(contract.freelancer as any)?.email} (ID: ${contract.freelancer})`);
      console.log('');
    });

    // Test the exact query the API uses
    console.log('\n  Testing exact API query...');
    const query = {
      $or: [
        { client: user._id },
        { freelancer: user._id },
      ]
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const apiResult = await Contract.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
          pipeline: [
            { $project: { profile: 1, rating: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'freelancer',
          foreignField: '_id',
          as: 'freelancer',
          pipeline: [
            { $project: { profile: 1, freelancerProfile: 1, rating: 1 } }
          ]
        }
      },
      {
        $addFields: {
          client: { $arrayElemAt: ['$client', 0] },
          freelancer: { $arrayElemAt: ['$freelancer', 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    console.log(`   API aggregation result: ${apiResult.length} contracts`);
    apiResult.forEach((contract, index) => {
      console.log(`  ${index + 1}. ${contract.title}`);
      console.log(`     Status: ${contract.status}`);
      console.log(`     Has client: ${!!contract.client}`);
      console.log(`     Has freelancer: ${!!contract.freelancer}`);
    });

  } catch (error) {
    console.error('  Error debugging user contracts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n   Disconnected from MongoDB');
  }
}

// Run the script
debugUserContracts().catch(console.error);