import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '@/models/Role';
import { Permission } from '@/models/Permission';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { seedPermissions } from './seedPermissions';

dotenv.config();

export async function seedRoles() {
  try {
    logger.info(' Seeding system roles...');
    
    // Ensure permissions exist first
    let permissions = await Permission.find({});
    if (permissions.length === 0) {
      logger.info('No permissions found, seeding permissions first...');
      permissions = await seedPermissions();
    }
    
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    const createdBy = adminUser?._id;
    
    // Define system roles with their permissions
    const systemRoles = [
      {
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Full platform access with all permissions',
        isSystem: true,
        permissions: permissions.map(p => p._id), // All permissions
      },
      {
        name: 'Moderator',
        slug: 'moderator',
        description: 'Content moderation and user management',
        isSystem: true,
        permissions: permissions.filter(p => 
          p.name.includes('.moderate') ||
          p.name.includes('users.read') ||
          p.name.includes('users.suspend') ||
          p.name.includes('reviews.') ||
          p.name.includes('projects.read') ||
          p.name.includes('support.')
        ).map(p => p._id),
      },
      {
        name: 'Support Agent',
        slug: 'support-agent',
        description: 'Customer support and ticket management',
        isSystem: true,
        permissions: permissions.filter(p =>
          p.name.includes('support.') ||
          p.name.includes('users.read') ||
          p.name.includes('projects.read') ||
          p.name.includes('contracts.read') ||
          p.name.includes('messages.read')
        ).map(p => p._id),
      },
      {
        name: 'Financial Manager',
        slug: 'financial-manager',
        description: 'Payment and transaction management',
        isSystem: true,
        permissions: permissions.filter(p =>
          p.name.includes('payments.') ||
          p.name.includes('transactions.') ||
          p.name.includes('analytics.') ||
          p.name.includes('contracts.read')
        ).map(p => p._id),
      },
    ];
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const roleData of systemRoles) {
      const existing = await Role.findOne({ slug: roleData.slug });
      
      if (existing) {
        // Update existing role
        existing.name = roleData.name;
        existing.description = roleData.description;
        existing.permissions = roleData.permissions as any;
        existing.isSystem = roleData.isSystem;
        await existing.save();
        updatedCount++;
        logger.info(`  Updated role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      } else {
        // Create new role
        await Role.create({
          ...roleData,
          createdBy,
        });
        createdCount++;
        logger.info(`  Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      }
    }
    
    logger.info(` Roles seeded: ${createdCount} created, ${updatedCount} updated`);
    
    return await Role.find({ isSystem: true });
  } catch (error) {
    logger.error(' Error seeding roles:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev')
    .then(async () => {
      logger.info(' Connected to MongoDB');
      await seedRoles();
      await mongoose.disconnect();
      logger.info(' Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(' Error:', error);
      process.exit(1);
    });
}
