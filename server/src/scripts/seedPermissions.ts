import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Permission } from '@/models/Permission';
import { logger } from '@/utils/logger';

dotenv.config();

const systemPermissions = [
  // User Management
  { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users', scope: 'any' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'View user information', scope: 'any' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Update user information', scope: 'any' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users', scope: 'any' },
  { name: 'users.suspend', resource: 'users', action: 'suspend', description: 'Suspend user accounts', scope: 'any' },
  { name: 'users.verify', resource: 'users', action: 'verify', description: 'Verify user accounts', scope: 'any' },
  
  // Project Management
  { name: 'projects.create', resource: 'projects', action: 'create', description: 'Create new projects', scope: 'own' },
  { name: 'projects.read', resource: 'projects', action: 'read', description: 'View projects', scope: 'any' },
  { name: 'projects.update', resource: 'projects', action: 'update', description: 'Update projects', scope: 'own' },
  { name: 'projects.delete', resource: 'projects', action: 'delete', description: 'Delete projects', scope: 'own' },
  { name: 'projects.moderate', resource: 'projects', action: 'moderate', description: 'Moderate any project', scope: 'any' },
  
  // Contract Management
  { name: 'contracts.create', resource: 'contracts', action: 'create', description: 'Create contracts', scope: 'own' },
  { name: 'contracts.read', resource: 'contracts', action: 'read', description: 'View contracts', scope: 'own' },
  { name: 'contracts.update', resource: 'contracts', action: 'update', description: 'Update contracts', scope: 'own' },
  { name: 'contracts.delete', resource: 'contracts', action: 'delete', description: 'Delete contracts', scope: 'own' },
  { name: 'contracts.approve', resource: 'contracts', action: 'approve', description: 'Approve contract milestones', scope: 'own' },
  { name: 'contracts.moderate', resource: 'contracts', action: 'moderate', description: 'Moderate any contract', scope: 'any' },
  
  // Payment Management
  { name: 'payments.create', resource: 'payments', action: 'create', description: 'Process payments', scope: 'own' },
  { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payment information', scope: 'own' },
  { name: 'payments.refund', resource: 'payments', action: 'refund', description: 'Process refunds', scope: 'any' },
  { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage all payments', scope: 'any' },
  
  // Transaction Management
  { name: 'transactions.read', resource: 'transactions', action: 'read', description: 'View transactions', scope: 'own' },
  { name: 'transactions.manage', resource: 'transactions', action: 'manage', description: 'Manage all transactions', scope: 'any' },
  
  // Review Management
  { name: 'reviews.create', resource: 'reviews', action: 'create', description: 'Create reviews', scope: 'own' },
  { name: 'reviews.read', resource: 'reviews', action: 'read', description: 'View reviews', scope: 'any' },
  { name: 'reviews.update', resource: 'reviews', action: 'update', description: 'Update own reviews', scope: 'own' },
  { name: 'reviews.delete', resource: 'reviews', action: 'delete', description: 'Delete reviews', scope: 'own' },
  { name: 'reviews.moderate', resource: 'reviews', action: 'moderate', description: 'Moderate any review', scope: 'any' },
  
  // Message Management
  { name: 'messages.send', resource: 'messages', action: 'send', description: 'Send messages', scope: 'own' },
  { name: 'messages.read', resource: 'messages', action: 'read', description: 'Read messages', scope: 'own' },
  { name: 'messages.moderate', resource: 'messages', action: 'moderate', description: 'Moderate any message', scope: 'any' },
  
  // Dispute Management
  { name: 'disputes.create', resource: 'disputes', action: 'create', description: 'Create disputes', scope: 'own' },
  { name: 'disputes.read', resource: 'disputes', action: 'read', description: 'View disputes', scope: 'own' },
  { name: 'disputes.resolve', resource: 'disputes', action: 'resolve', description: 'Resolve disputes', scope: 'any' },
  
  // Support Ticket Management
  { name: 'support.create', resource: 'support', action: 'create', description: 'Create support tickets', scope: 'own' },
  { name: 'support.read', resource: 'support', action: 'read', description: 'View support tickets', scope: 'own' },
  { name: 'support.respond', resource: 'support', action: 'respond', description: 'Respond to support tickets', scope: 'any' },
  { name: 'support.close', resource: 'support', action: 'close', description: 'Close support tickets', scope: 'any' },
  
  // Analytics
  { name: 'analytics.view', resource: 'analytics', action: 'view', description: 'View analytics dashboards', scope: 'any' },
  { name: 'analytics.export', resource: 'analytics', action: 'export', description: 'Export analytics data', scope: 'any' },
  
  // Settings Management
  { name: 'settings.read', resource: 'settings', action: 'read', description: 'View platform settings', scope: 'any' },
  { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update platform settings', scope: 'any' },
  
  // RBAC Management
  { name: 'rbac.roles.create', resource: 'rbac', action: 'create_role', description: 'Create roles', scope: 'any' },
  { name: 'rbac.roles.update', resource: 'rbac', action: 'update_role', description: 'Update roles', scope: 'any' },
  { name: 'rbac.roles.delete', resource: 'rbac', action: 'delete_role', description: 'Delete roles', scope: 'any' },
  { name: 'rbac.permissions.grant', resource: 'rbac', action: 'grant_permission', description: 'Grant permissions to users', scope: 'any' },
  { name: 'rbac.permissions.revoke', resource: 'rbac', action: 'revoke_permission', description: 'Revoke permissions from users', scope: 'any' },
  { name: 'rbac.audit.view', resource: 'rbac', action: 'view_audit', description: 'View audit logs', scope: 'any' },
];

export async function seedPermissions() {
  try {
    logger.info(' Seeding system permissions...');
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const permData of systemPermissions) {
      const existing = await Permission.findOne({ name: permData.name });
      
      if (existing) {
        // Update existing permission
        existing.resource = permData.resource;
        existing.action = permData.action;
        existing.description = permData.description;
        existing.scope = permData.scope as any;
        await existing.save();
        updatedCount++;
      } else {
        // Create new permission
        await Permission.create(permData);
        createdCount++;
      }
    }
    
    logger.info(` Permissions seeded: ${createdCount} created, ${updatedCount} updated`);
    
    return await Permission.find({});
  } catch (error) {
    logger.error(' Error seeding permissions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev')
    .then(async () => {
      logger.info(' Connected to MongoDB');
      await seedPermissions();
      await mongoose.disconnect();
      logger.info(' Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(' Error:', error);
      process.exit(1);
    });
}
