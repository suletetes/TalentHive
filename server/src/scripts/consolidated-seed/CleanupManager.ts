import { promises as fs } from 'fs';
import * as path from 'path';
import { Logger } from './types';

export interface CleanupConfig {
  dryRun?: boolean;
  backupBeforeDelete?: boolean;
  backupDirectory?: string;
  filesToDelete: string[];
  directoriesToClean?: string[];
}

export class CleanupManager {
  private logger: Logger;
  private config: CleanupConfig;

  constructor(config: CleanupConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Remove old seeding files and clean up obsolete code
   */
  async cleanupOldSeedingFiles(): Promise<void> {
    this.logger.info('Starting cleanup of old seeding files...');

    const filesToDelete = [
      'server/src/scripts/enhancedSeedDataV2.ts',
      'server/src/scripts/realisticDataGenerators.ts',
      'server/src/scripts/seedData.ts',
      'server/src/scripts/seedDatabase.ts',
      'server/src/scripts/generateTestData.ts'
    ];

    for (const filePath of filesToDelete) {
      await this.deleteFileIfExists(filePath);
    }

    // Clean up any remaining old script references
    await this.cleanupImportReferences();
    
    this.logger.info('Cleanup of old seeding files completed');
  }

  /**
   * Delete a file if it exists, with optional backup
   */
  private async deleteFileIfExists(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      const exists = await this.fileExists(fullPath);
      
      if (!exists) {
        this.logger.debug(`File does not exist: ${filePath}`);
        return;
      }

      if (this.config.backupBeforeDelete) {
        await this.backupFile(fullPath);
      }

      if (!this.config.dryRun) {
        await fs.unlink(fullPath);
        this.logger.info(`Deleted file: ${filePath}`);
      } else {
        this.logger.info(`[DRY RUN] Would delete file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a backup of a file before deletion
   */
  private async backupFile(filePath: string): Promise<void> {
    try {
      const backupDir = this.config.backupDirectory || 'backup/old-seeding-scripts';
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.backup`);

      // Ensure backup directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      // Copy file to backup location
      await fs.copyFile(filePath, backupPath);
      this.logger.info(`Backed up file to: ${backupPath}`);
    } catch (error) {
      this.logger.error(`Failed to backup file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Clean up import references to old seeding scripts
   */
  private async cleanupImportReferences(): Promise<void> {
    this.logger.info('Cleaning up import references to old seeding scripts...');
    
    const filesToCheck = [
      'server/src/app.ts',
      'server/src/routes/index.ts',
      'server/package.json'
    ];

    for (const filePath of filesToCheck) {
      await this.cleanupImportsInFile(filePath);
    }
  }

  /**
   * Remove import statements referencing old seeding scripts from a file
   */
  private async cleanupImportsInFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      const exists = await this.fileExists(fullPath);
      
      if (!exists) {
        this.logger.debug(`File does not exist for import cleanup: ${filePath}`);
        return;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const oldImportPatterns = [
        /import.*from.*['"].*enhancedSeedDataV2.*['"];?\s*\n?/g,
        /import.*from.*['"].*realisticDataGenerators.*['"];?\s*\n?/g,
        /import.*from.*['"].*seedData.*['"];?\s*\n?/g,
        /import.*from.*['"].*seedDatabase.*['"];?\s*\n?/g,
        /import.*from.*['"].*generateTestData.*['"];?\s*\n?/g
      ];

      let updatedContent = content;
      let hasChanges = false;

      for (const pattern of oldImportPatterns) {
        const newContent = updatedContent.replace(pattern, '');
        if (newContent !== updatedContent) {
          hasChanges = true;
          updatedContent = newContent;
        }
      }

      if (hasChanges && !this.config.dryRun) {
        await fs.writeFile(fullPath, updatedContent, 'utf-8');
        this.logger.info(`Cleaned up imports in: ${filePath}`);
      } else if (hasChanges) {
        this.logger.info(`[DRY RUN] Would clean up imports in: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup imports in ${filePath}:`, error);
    }
  }

  /**
   * Generate cleanup report
   */
  async generateCleanupReport(): Promise<{
    filesDeleted: string[];
    importsUpdated: string[];
    backupsCreated: string[];
    errors: string[];
  }> {
    // This would be implemented to track and report cleanup operations
    return {
      filesDeleted: [],
      importsUpdated: [],
      backupsCreated: [],
      errors: []
    };
  }
}