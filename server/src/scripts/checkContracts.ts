/**
 * Script to check contracts in the database
 * Run with: npm run check:contracts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import '../models/Contract';
import '../models/User';
import '../models/Project';
import '../models/Proposal';

const Contract = mongoose.model('Contract');
const User = mongoose.model('User');

async function checkContracts() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive');
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 CONTRACT ANALYSIS');
    console.log('='.repeat(50));

    // Count total contracts
    const totalContracts = await Contract.countDocuments();
    console.log(`📋 Total contracts in database: ${totalContracts}`);

    if (totalContracts === 0) {
      console.log('❌ No contracts found in database!');
      console.log('\n💡 SOLUTIONS:');
      console.log('1. Run the seed script: npm run seed');
      console.log('2. Create contracts manually through the application');
      console.log('3. Check if you\'re connected to the correct database');
      
      // Check users
      const totalUsers = await User.countDocuments();
      console.log(`\n👥 Total users in database: ${totalUsers}`);
      
      if (totalUsers === 0) {
        console.log('❌ No users found either! Database might be empty.');
        console.log('   Run: npm run seed:all');
      } else {
        console.log('✅ Users exist, but no contracts created yet.');
      }
    } else {
      console.log('✅ Contracts found! Analyzing...\n');

      // Analyze contracts by status
      const statusCounts = await Contract.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      console.log('📈 Contracts by Status:');
      statusCounts.forEach(({ _id, count }) => {
        console.log(`   ${_id}: ${count}`);
      });

      // Analyze contracts by source type
      const sourceCounts = await Contract.aggregate([
        { $group: { _id: '$sourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      console.log('\n🔗 Contracts by Source:');
      sourceCounts.forEach(({ _id, count }) => {
        console.log(`   ${_id || 'undefined'}: ${count}`);
      });

      // Show recent contracts
      console.log('\n📅 Recent Contracts (last 5):');
      const recentContracts = await Contract.find()
        .populate('client', 'profile.firstName profile.lastName email')
        .populate('freelancer', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentContracts.forEach((contract, index) => {
        const client = contract.client as any;
        const freelancer = contract.freelancer as any;
        
        console.log(`   ${index + 1}. ${contract.title}`);
        console.log(`      ID: ${contract._id}`);
        console.log(`      Status: ${contract.status}`);
        console.log(`      Source: ${contract.sourceType || 'undefined'}`);
        console.log(`      Client: ${client?.profile?.firstName} ${client?.profile?.lastName} (${client?.email})`);
        console.log(`      Freelancer: ${freelancer?.profile?.firstName} ${freelancer?.profile?.lastName} (${freelancer?.email})`);
        console.log(`      Created: ${contract.createdAt}`);
        console.log('');
      });

      // Check for specific user contracts
      console.log('🔍 Checking contracts for specific users...');
      
      // Get some users to test with
      const users = await User.find().limit(5).lean();
      
      for (const user of users) {
        const userContracts = await Contract.find({
          $or: [
            { client: user._id },
            { freelancer: user._id }
          ]
        }).countDocuments();
        
        if (userContracts > 0) {
          console.log(`   ${user.profile?.firstName} ${user.profile?.lastName} (${user.email}): ${userContracts} contracts`);
        }
      }
    }

    console.log('\n🔧 DATABASE CONNECTION INFO:');
    console.log(`   Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);

  } catch (error) {
    console.error('❌ Error checking contracts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the check
checkContracts().catch(console.error);