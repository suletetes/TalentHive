import { logger } from '@/utils/logger';
import path from 'path';
import fs from 'fs/promises';

/**
 * Consolidation report interface
 */
export interface ConsolidationReport {
  migratedFunctions: string[];
  removedFiles: string[];
  updatedImports: string[];
  warnings: string[];
  errors: string[];
  summary: {
    totalFilesProcessed: number;
    functionsExtracted: number;
    filesRemoved: number;
    importsUpdated: number;
  };
}

/**
 * Script consolidator that migrates useful logic from old seeding scripts
 * to the new consolidated system and removes duplicate functionality
 */
export class ScriptConsolidator {
  private scriptsDirectory = 'server/src/scripts';
  private consolidatedDirectory = 'server/src/scripts/consolidated-seed';
  private obsoleteScripts = [
    'enhancedSeedDataV2.ts',
    'seedEnhanced.ts', 
    'seedWithCompleteProfiles.ts',
    'completeProfileSeed.ts'
  ];

  /**
   * Consolidate existing seeding scripts
   */
  async consolidateScripts(): Promise<ConsolidationReport> {
    logger.info(' Starting script consolidation process...');

    const report: ConsolidationReport = {
      migratedFunctions: [],
      removedFiles: [],
      updatedImports: [],
      warnings: [],
      errors: [],
      summary: {
        totalFilesProcessed: 0,
        functionsExtracted: 0,
        filesRemoved: 0,
        importsUpdated: 0
      }
    };

    try {
      // Step 1: Extract useful functions from obsolete scripts
      await this.extractUsefulFunctions(report);

      // Step 2: Update import statements in remaining files
      await this.updateImportStatements(report);

      // Step 3: Remove obsolete scripts (with backup)
      await this.removeObsoleteScripts(report);

      // Step 4: Create migration documentation
      await this.createMigrationDocumentation(report);

      logger.info(` Script consolidation complete. Processed ${report.summary.totalFilesProcessed} files.`);
      
    } catch (error) {
      logger.error(' Script consolidation failed:', error);
      report.errors.push(`Consolidation failed: ${error}`);
    }

    return report;
  }

  /**
   * Extract useful functions from obsolete scripts
   */
  private async extractUsefulFunctions(report: ConsolidationReport): Promise<void> {
    logger.info(' Extracting useful functions from obsolete scripts...');

    for (const scriptName of this.obsoleteScripts) {
      const scriptPath = path.join(this.scriptsDirectory, scriptName);
      
      try {
        // Check if file exists
        const fileExists = await this.fileExists(scriptPath);
        if (!fileExists) {
          report.warnings.push(`Script not found: ${scriptName}`);
          continue;
        }

        const content = await fs.readFile(scriptPath, 'utf-8');
        report.summary.totalFilesProcessed++;

        // Extract specific useful functions based on script type
        switch (scriptName) {
          case 'enhancedSeedDataV2.ts':
            await this.extractFromEnhancedSeedV2(content, report);
            break;
          case 'seedEnhanced.ts':
            await this.extractFromSeedEnhanced(content, report);
            break;
          case 'seedWithCompleteProfiles.ts':
            await this.extractFromCompleteProfiles(content, report);
            break;
          case 'completeProfileSeed.ts':
            await this.extractFromCompleteProfileSeed(content, report);
            break;
        }

      } catch (error) {
        report.errors.push(`Failed to process ${scriptName}: ${error}`);
      }
    }
  }

  /**
   * Extract functions from enhancedSeedDataV2.ts
   */
  private async extractFromEnhancedSeedV2(content: string, report: ConsolidationReport): Promise<void> {
    // This script appears to be incomplete/corrupted, so we'll skip extraction
    // but note it for removal
    report.warnings.push('enhancedSeedDataV2.ts appears incomplete - skipping function extraction');
  }

  /**
   * Extract functions from seedEnhanced.ts
   */
  private async extractFromSeedEnhanced(content: string, report: ConsolidationReport): Promise<void> {
    // Extract slug generation logic (already implemented in SlugGenerator)
    if (content.includes('profileSlug')) {
      report.migratedFunctions.push('Slug generation logic (already implemented in SlugGenerator)');
    }

    // Extract contract completion logic
    if (content.includes('markContractsCompleted')) {
      const contractLogic = this.extractFunction(content, 'markContractsCompleted');
      if (contractLogic) {
        await this.saveExtractedFunction('ContractStatusUpdater.ts', contractLogic);
        report.migratedFunctions.push('Contract completion logic');
        report.summary.functionsExtracted++;
      }
    }

    // Extract profile viewer logic
    if (content.includes('addProfileViewers')) {
      const viewerLogic = this.extractFunction(content, 'addProfileViewers');
      if (viewerLogic) {
        await this.saveExtractedFunction('ProfileViewerGenerator.ts', viewerLogic);
        report.migratedFunctions.push('Profile viewer generation');
        report.summary.functionsExtracted++;
      }
    }
  }

  /**
   * Extract functions from seedWithCompleteProfiles.ts
   */
  private async extractFromCompleteProfiles(content: string, report: ConsolidationReport): Promise<void> {
    // The complete profile functionality is already implemented in UserGenerator
    report.migratedFunctions.push('Complete profile generation (already implemented in UserGenerator)');
  }

  /**
   * Extract functions from completeProfileSeed.ts
   */
  private async extractFromCompleteProfileSeed(content: string, report: ConsolidationReport): Promise<void> {
    // Extract any unique profile generation logic not already covered
    if (content.includes('generateCompleteFreelancerProfiles')) {
      report.migratedFunctions.push('Complete freelancer profiles (functionality integrated into UserGenerator)');
    }
  }

  /**
   * Update import statements in remaining files
   */
  private async updateImportStatements(report: ConsolidationReport): Promise<void> {
    logger.info(' Updating import statements...');

    // Find all TypeScript files that might import obsolete scripts
    const allTsFiles = await this.findTypeScriptFiles();

    for (const filePath of allTsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let updatedContent = content;
        let hasChanges = false;

        // Update imports from obsolete scripts to new consolidated system
        for (const obsoleteScript of this.obsoleteScripts) {
          const scriptNameWithoutExt = obsoleteScript.replace('.ts', '');
          const oldImportPattern = new RegExp(`from ['"].*${scriptNameWithoutExt}['"]`, 'g');
          
          if (oldImportPattern.test(content)) {
            // Replace with import from consolidated system
            updatedContent = updatedContent.replace(
              oldImportPattern,
              `from '../consolidated-seed/SeedManager'`
            );
            hasChanges = true;
          }
        }

        // Update specific function imports
        const importUpdates = [
          {
            old: /from ['"].*realisticDataGenerators['"]/g,
            new: `from '../consolidated-seed/realisticDataGenerators'`
          },
          {
            old: /from ['"].*enhancedSeedDataV2['"]/g,
            new: `from '../consolidated-seed/SeedManager'`
          }
        ];

        for (const update of importUpdates) {
          if (update.old.test(updatedContent)) {
            updatedContent = updatedContent.replace(update.old, update.new);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await fs.writeFile(filePath, updatedContent, 'utf-8');
          report.updatedImports.push(filePath);
          report.summary.importsUpdated++;
        }

      } catch (error) {
        report.errors.push(`Failed to update imports in ${filePath}: ${error}`);
      }
    }
  }

  /**
   * Remove obsolete scripts (with backup)
   */
  private async removeObsoleteScripts(report: ConsolidationReport): Promise<void> {
    logger.info(' Removing obsolete scripts (creating backups)...');

    // Create backup directory
    const backupDir = path.join(this.scriptsDirectory, 'obsolete-backup');
    await this.ensureDirectoryExists(backupDir);

    for (const scriptName of this.obsoleteScripts) {
      const scriptPath = path.join(this.scriptsDirectory, scriptName);
      const backupPath = path.join(backupDir, scriptName);

      try {
        const fileExists = await this.fileExists(scriptPath);
        if (!fileExists) {
          report.warnings.push(`Script not found for removal: ${scriptName}`);
          continue;
        }

        // Create backup
        await fs.copyFile(scriptPath, backupPath);
        
        // Remove original
        await fs.unlink(scriptPath);
        
        report.removedFiles.push(scriptName);
        report.summary.filesRemoved++;
        
        logger.info(` Backed up and removed: ${scriptName}`);

      } catch (error) {
        report.errors.push(`Failed to remove ${scriptName}: ${error}`);
      }
    }
  }

  /**
   * Create migration documentation
   */
  private async createMigrationDocumentation(report: ConsolidationReport): Promise<void> {
    logger.info(' Creating migration documentation...');

    const documentation = `# Script Consolidation Migration Report

Generated: ${new Date().toISOString()}

## Summary
- Total files processed: ${report.summary.totalFilesProcessed}
- Functions extracted: ${report.summary.functionsExtracted}
- Files removed: ${report.summary.filesRemoved}
- Imports updated: ${report.summary.importsUpdated}

## Migrated Functions
${report.migratedFunctions.map(func => `- ${func}`).join('\n')}

## Removed Files
${report.removedFiles.map(file => `- ${file} (backed up to obsolete-backup/)`).join('\n')}

## Updated Import Statements
${report.updatedImports.map(file => `- ${file}`).join('\n')}

## Warnings
${report.warnings.map(warning => `- ${warning}`).join('\n')}

## Errors
${report.errors.map(error => `- ${error}`).join('\n')}

## Migration Notes

### Functionality Consolidation
1. **User Generation**: All user generation logic has been consolidated into \`UserGenerator.ts\`
2. **Slug Generation**: Moved to dedicated \`SlugGenerator.ts\` with improved conflict resolution
3. **Data Validation**: Centralized in \`DataQualityValidator.ts\`
4. **Batch Operations**: Handled by \`BatchProcessor.ts\`
5. **Configuration**: Managed by \`ConfigurationManager.ts\`

### New Architecture Benefits
- **Modular Design**: Each generator is independent and testable
- **Consistent Interfaces**: All generators implement the same \`DataGenerator\` interface
- **Better Error Handling**: Comprehensive validation and error recovery
- **Performance Optimization**: Batch processing and parallel generation
- **Quality Assurance**: Built-in data quality validation

### Usage Migration
Old usage:
\`\`\`typescript
import { enhanceSeedData } from './enhancedSeedDataV2';
await enhanceSeedData();
\`\`\`

New usage:
\`\`\`typescript
import { SeedManager } from './consolidated-seed/SeedManager';
import { ConfigurationManager } from './consolidated-seed/ConfigurationManager';

const config = ConfigurationManager.createFromEnvironment();
const seedManager = new SeedManager();
await seedManager.execute(config);
\`\`\`

### Backup Location
All removed scripts have been backed up to: \`server/src/scripts/obsolete-backup/\`

These backups can be safely deleted after verifying the new system works correctly.
`;

    const docPath = path.join(this.consolidatedDirectory, 'MIGRATION_REPORT.md');
    await fs.writeFile(docPath, documentation, 'utf-8');
    
    logger.info(` Migration documentation created: ${docPath}`);
  }

  // Helper methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const searchDirs = [
      'server/src',
      'server/src/routes',
      'server/src/controllers',
      'server/src/services',
      'server/src/utils'
    ];

    for (const dir of searchDirs) {
      try {
        const dirFiles = await this.getFilesRecursively(dir, '.ts');
        files.push(...dirFiles);
      } catch (error) {
        // Directory might not exist
      }
    }

    return files;
  }

  private async getFilesRecursively(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Handle permission errors or missing directories
    }

    return files;
  }

  private extractFunction(content: string, functionName: string): string | null {
    // Simple function extraction - in a real implementation, this would use AST parsing
    const functionRegex = new RegExp(`(async\\s+)?function\\s+${functionName}[\\s\\S]*?^}`, 'm');
    const match = content.match(functionRegex);
    return match ? match[0] : null;
  }

  private async saveExtractedFunction(fileName: string, functionCode: string): Promise<void> {
    const filePath = path.join(this.consolidatedDirectory, fileName);
    
    const fileContent = `// Extracted function from legacy seeding script
// This functionality should be integrated into the appropriate generator

${functionCode}

// TODO: Integrate this function into the appropriate consolidated generator
export default {};
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');
  }

  /**
   * Validate consolidation was successful
   */
  async validateConsolidation(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check that consolidated system files exist
    const requiredFiles = [
      'SeedManager.ts',
      'UserGenerator.ts',
      'SlugGenerator.ts',
      'ConfigurationManager.ts',
      'BatchProcessor.ts',
      'DataQualityValidator.ts'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.consolidatedDirectory, file);
      const exists = await this.fileExists(filePath);
      if (!exists) {
        issues.push(`Required consolidated file missing: ${file}`);
      }
    }

    // Check that obsolete files are removed
    for (const obsoleteFile of this.obsoleteScripts) {
      const filePath = path.join(this.scriptsDirectory, obsoleteFile);
      const exists = await this.fileExists(filePath);
      if (exists) {
        issues.push(`Obsolete file still exists: ${obsoleteFile}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Rollback consolidation (restore from backup)
   */
  async rollbackConsolidation(): Promise<void> {
    logger.info(' Rolling back script consolidation...');

    const backupDir = path.join(this.scriptsDirectory, 'obsolete-backup');
    
    for (const scriptName of this.obsoleteScripts) {
      const backupPath = path.join(backupDir, scriptName);
      const originalPath = path.join(this.scriptsDirectory, scriptName);

      try {
        const backupExists = await this.fileExists(backupPath);
        if (backupExists) {
          await fs.copyFile(backupPath, originalPath);
          logger.info(` Restored: ${scriptName}`);
        }
      } catch (error) {
        logger.error(`Failed to restore ${scriptName}:`, error);
      }
    }

    logger.info(' Rollback complete');
  }
}