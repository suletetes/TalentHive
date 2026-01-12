#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Command } from 'commander';
import { logger } from '@/utils/logger';
import { dataConsistencyService } from '@/services/dataConsistencyService';

dotenv.config();

const program = new Command();

program
  .name('validate-data')
  .description('TalentHive Data Validation and Consistency Check Utility')
  .version('1.0.0');

program
  .command('check')
  .description('Run consistency checks without fixing issues')
  .option('-r, --ratings', 'Check user ratings only')
  .option('-c, --contracts', 'Check contract amounts only')
  .option('-f, --references', 'Check referential integrity only')
  .option('--report <file>', 'Save report to file')
  .action(async (options) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev');
      logger.info('  Connected to MongoDB');

      let report;

      if (options.ratings) {
        logger.info('  Checking user ratings...');
        report = await dataConsistencyService.syncAllRatings();
      } else if (options.contracts) {
        logger.info('  Checking contract amounts...');
        report = await dataConsistencyService.validateAllContracts();
      } else if (options.references) {
        logger.info('  Checking referential integrity...');
        report = await dataConsistencyService.validateAllReferences();
      } else {
        logger.info('  Running full consistency check...');
        report = await dataConsistencyService.runFullConsistencyCheck();
      }

      // Display results
      logger.info('\n  Consistency Check Results:');
      logger.info(`  Total Checked: ${report.totalChecked}`);
      logger.info(`  Issues Found: ${report.issuesFound}`);

      if (report.issuesFound > 0) {
        logger.info('\n   Issues:');
        report.issues.forEach((issue, index) => {
          logger.info(`\n  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
          logger.info(`     Entity: ${issue.entity} (${issue.entityId})`);
          logger.info(`     Description: ${issue.description}`);
          if (issue.expectedValue !== undefined) {
            logger.info(`     Expected: ${JSON.stringify(issue.expectedValue)}`);
            logger.info(`     Actual: ${JSON.stringify(issue.actualValue)}`);
          }
          logger.info(`     Can Auto-Fix: ${issue.canAutoFix ? 'Yes' : 'No'}`);
        });
      } else {
        logger.info('\n  No issues found! Data is consistent.');
      }

      // Save report if requested
      if (options.report) {
        const fs = require('fs');
        fs.writeFileSync(options.report, JSON.stringify(report, null, 2));
        logger.info(`\n📄 Report saved to: ${options.report}`);
      }

      await mongoose.disconnect();
      process.exit(report.issuesFound > 0 ? 1 : 0);
    } catch (error) {
      logger.error('  Error during validation:', error);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Run consistency checks and automatically fix issues where possible')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--report <file>', 'Save fix report to file')
  .action(async (options) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev');
      logger.info('  Connected to MongoDB');

      logger.info('  Running full consistency check...');
      const report = await dataConsistencyService.runFullConsistencyCheck();

      logger.info(`\n  Found ${report.issuesFound} issues`);

      if (report.issuesFound === 0) {
        logger.info('  No issues found! Data is consistent.');
        await mongoose.disconnect();
        process.exit(0);
      }

      if (options.dryRun) {
        logger.info('\n  DRY RUN - No changes will be made\n');
        logger.info('Issues that can be auto-fixed:');
        report.issues.filter(i => i.canAutoFix).forEach((issue, index) => {
          logger.info(`  ${index + 1}. ${issue.type} - ${issue.description}`);
        });
        logger.info('\nIssues that require manual intervention:');
        report.issues.filter(i => !i.canAutoFix).forEach((issue, index) => {
          logger.info(`  ${index + 1}. ${issue.type} - ${issue.description}`);
        });
      } else {
        logger.info('\n🔧 Attempting to fix issues...');
        const fixReport = await dataConsistencyService.fixInconsistencies(report, true);

        logger.info('\n  Fix Results:');
        logger.info(`  Issues Fixed: ${fixReport.issuesFixed}`);
        logger.info(`  Issues Failed: ${fixReport.issuesFailed}`);

        if (fixReport.issuesFixed > 0) {
          logger.info('\n  Successfully Fixed:');
          fixReport.details.filter(d => d.fixed).forEach((detail, index) => {
            logger.info(`  ${index + 1}. ${detail.issue.type} - ${detail.issue.description}`);
          });
        }

        if (fixReport.issuesFailed > 0) {
          logger.info('\n  Failed to Fix:');
          fixReport.details.filter(d => !d.fixed).forEach((detail, index) => {
            logger.info(`  ${index + 1}. ${detail.issue.type} - ${detail.issue.description}`);
            logger.info(`     Reason: ${detail.error}`);
          });
        }

        // Save report if requested
        if (options.report) {
          const fs = require('fs');
          fs.writeFileSync(options.report, JSON.stringify(fixReport, null, 2));
          logger.info(`\n📄 Fix report saved to: ${options.report}`);
        }
      }

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      logger.error('  Error during fix:', error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Display database statistics')
  .action(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive_dev');
      logger.info('  Connected to MongoDB');

      const { User } = await import('@/models/User');
      const { Project } = await import('@/models/Project');
      const { Contract } = await import('@/models/Contract');
      const { Review } = await import('@/models/Review');
      const { Permission } = await import('@/models/Permission');
      const { Role } = await import('@/models/Role');

      const [
        totalUsers,
        totalProjects,
        totalContracts,
        totalReviews,
        totalPermissions,
        totalRoles,
        usersWithRatings,
        contractsWithMilestones,
      ] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Contract.countDocuments(),
        Review.countDocuments({ status: 'published' }),
        Permission.countDocuments(),
        Role.countDocuments(),
        User.countDocuments({ 'rating.count': { $gt: 0 } }),
        Contract.countDocuments({ 'milestones.0': { $exists: true } }),
      ]);

      logger.info('\n  Database Statistics:');
      logger.info(`  Total Users: ${totalUsers}`);
      logger.info(`  Total Projects: ${totalProjects}`);
      logger.info(`  Total Contracts: ${totalContracts}`);
      logger.info(`  Total Reviews: ${totalReviews}`);
      logger.info(`  Total Permissions: ${totalPermissions}`);
      logger.info(`  Total Roles: ${totalRoles}`);
      logger.info(`  Users with Ratings: ${usersWithRatings}`);
      logger.info(`  Contracts with Milestones: ${contractsWithMilestones}`);

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      logger.error('  Error getting stats:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
