import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

/**
 * Handles database operations for seeding
 * Manages connections, cleanup, and batch operations
 */
export class DatabaseOperations {
  private isConnected: boolean = false;

  /**
   * Connect to MongoDB database
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info(' Database already connected');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev';
      await mongoose.connect(mongoUri);
      this.isConnected = true;
      logger.info(' Connected to MongoDB');
    } catch (error) {
      logger.error(' MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info(' Disconnected from MongoDB');
    } catch (error) {
      logger.error(' MongoDB disconnection failed:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Simple ping to test connection
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error(' Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Clear all data from database
   */
  async clearDatabase(): Promise<void> {
    logger.info(' Clearing existing data...');

    try {
      // Import models dynamically to avoid circular dependencies
      const { User } = await import('@/models/User');
      const { Organization } = await import('@/models/Organization');
      const { Project } = await import('@/models/Project');
      const { Proposal } = await import('@/models/Proposal');
      const { Contract } = await import('@/models/Contract');
      const { Review } = await import('@/models/Review');
      const { Message } = await import('@/models/Message');
      const { Notification } = await import('@/models/Notification');
      const { Category } = await import('@/models/Category');
      const { Skill } = await import('@/models/Skill');
      const { HireNowRequest } = await import('@/models/HireNowRequest');
      const { PlatformSettings } = await import('@/models/PlatformSettings');
      const { Settings } = await import('@/models/Settings');

      // Clear collections in dependency order
      const collections = [
        { name: 'Reviews', model: Review },
        { name: 'Messages', model: Message },
        { name: 'Notifications', model: Notification },
        { name: 'Contracts', model: Contract },
        { name: 'Proposals', model: Proposal },
        { name: 'HireNowRequests', model: HireNowRequest },
        { name: 'Projects', model: Project },
        { name: 'Organizations', model: Organization },
        { name: 'Users', model: User },
        { name: 'Skills', model: Skill },
        { name: 'Categories', model: Category },
        { name: 'PlatformSettings', model: PlatformSettings },
        { name: 'Settings', model: Settings },
      ];

      let totalDeleted = 0;
      for (const { name, model } of collections) {
        const result = await (model as any).deleteMany({});
        totalDeleted += result.deletedCount || 0;
        logger.info(`   Cleared ${result.deletedCount || 0} ${name}`);
      }

      // Clear additional collections that might exist
      try {
        const { Conversation } = await import('@/models/Conversation');
        const { Payment } = await import('@/models/Payment');
        const { Transaction } = await import('@/models/Transaction');
        const { Permission } = await import('@/models/Permission');
        const { Role } = await import('@/models/Role');
        const { AuditLog } = await import('@/models/AuditLog');

        const additionalCollections = [
          { name: 'Conversations', model: Conversation },
          { name: 'Payments', model: Payment },
          { name: 'Transactions', model: Transaction },
          { name: 'Permissions', model: Permission },
          { name: 'Roles', model: Role },
          { name: 'AuditLogs', model: AuditLog },
        ];

        for (const { name, model } of additionalCollections) {
          const result = await (model as any).deleteMany({});
          totalDeleted += result.deletedCount || 0;
          logger.info(`   Cleared ${result.deletedCount || 0} ${name}`);
        }
      } catch (error) {
        // Some models might not exist, continue
        logger.warn('Some additional models not found, continuing...');
      }

      logger.info(` Database cleared (${totalDeleted} total documents deleted)`);
    } catch (error) {
      logger.error(' Database clearing failed:', error);
      throw error;
    }
  }

  /**
   * Batch insert documents with error handling
   */
  async batchInsert<T>(model: any, documents: T[], batchSize: number = 100): Promise<T[]> {
    if (documents.length === 0) {
      return [];
    }

    const results: T[] = [];
    const batches = this.createBatches(documents, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const insertedDocs = await model.insertMany(batch, { ordered: false });
        results.push(...insertedDocs);
        logger.info(`   Batch ${i + 1}/${batches.length}: Inserted ${insertedDocs.length} documents`);
      } catch (error) {
        logger.error(` Batch ${i + 1} insertion failed:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    collections: Array<{ name: string; count: number; size: number }>;
    totalDocuments: number;
    totalSize: number;
  }> {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const stats = [];
      let totalDocuments = 0;
      let totalSize = 0;

      for (const collection of collections) {
        try {
          const count = await db.collection(collection.name).countDocuments();
          const collectionInfo = {
            name: collection.name,
            count: count || 0,
            size: 0, // Size not available without stats
          };
          stats.push(collectionInfo);
          totalDocuments += collectionInfo.count;
          totalSize += collectionInfo.size;
        } catch (error) {
          // Some collections might not support stats
          stats.push({
            name: collection.name,
            count: 0,
            size: 0,
          });
        }
      }

      return {
        collections: stats,
        totalDocuments,
        totalSize,
      };
    } catch (error) {
      logger.error(' Failed to get database stats:', error);
      return {
        collections: [],
        totalDocuments: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Log database statistics
   */
  async logDatabaseStats(): Promise<void> {
    const stats = await this.getDatabaseStats();
    
    logger.info(' Database Statistics:');
    logger.info(`   Total Documents: ${stats.totalDocuments}`);
    logger.info(`   Total Size: ${this.formatBytes(stats.totalSize)}`);
    logger.info('   Collections:');
    
    stats.collections
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .forEach(collection => {
        logger.info(`     ${collection.name}: ${collection.count} documents (${this.formatBytes(collection.size)})`);
      });
  }

  /**
   * Clean up resources and temporary data
   */
  async cleanup(): Promise<void> {
    logger.info(' Cleaning up database operations...');
    
    try {
      // Clear any temporary collections or indexes if needed
      // For now, just ensure connection is properly managed
      if (this.isConnected) {
        logger.info(' Database operations cleanup completed');
      }
    } catch (error) {
      logger.error(' Database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Create batches from array of documents
   */
  private createBatches<T>(documents: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if database is connected
   */
  isDbConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }
}