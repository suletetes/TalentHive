# Obsolete Seed Scripts - Backup

This directory contains the old seeding scripts that have been replaced by the new consolidated seeding system.

## Migration Date
January 2, 2026

## Reason for Obsolescence
These scripts have been consolidated into a unified, professional seeding system located in `../consolidated-seed/`. The new system provides:

- **Unified Interface**: Single CLI command for all seeding operations
- **Better Performance**: Batch processing and parallel generation
- **Data Quality**: Built-in validation and quality checks
- **Flexibility**: Environment-based configurations (development, testing, demo)
- **Maintainability**: Modular architecture with clear separation of concerns

## Obsolete Files

### Main Seed Scripts (Replaced)
- `seed.ts` - Original basic seed script
- `enhancedSeedData.ts` - Enhanced seeding with more realistic data
- `enhancedSeedDataV2.ts` - Second iteration (incomplete)
- `seedEnhanced.ts` - Enhanced seed with slug generation
- `seedComplete.ts` - Complete seeding workflow
- `seedWithCompleteProfiles.ts` - Seed with complete freelancer profiles
- `completeProfileSeed.ts` - Profile generation utilities

### Feature-Specific Seeds (Replaced)
- `seedClientData.ts` - Client-specific data seeding
- `seedNewFeatures.ts` - New features seeding

### Utility Scripts (Replaced)
- `checkEnhancedData.ts` - Data validation utility

## New System Usage

### Basic Seeding
```bash
# Development environment (default)
npm run seed

# Specific environment
npm run seed:dev
npm run seed:demo
npm run seed:testing
```

### Advanced Commands
```bash
# Check database status
npm run seed:status

# Clean database
npm run seed:clean

# Quality check
npm run seed:quality

# View configuration
npm run seed:config
```

### Data Validation
```bash
# Check data consistency
npm run validate-data:check

# Fix data issues
npm run validate-data:fix

# View database stats
npm run validate-data:stats
```

## Scripts Still in Use

The following scripts are still active and have NOT been moved to this backup:

- `seedPermissions.ts` - System permissions seeding (still used)
- `seedRoles.ts` - System roles seeding (still used)
- `seedWorkLogs.ts` - Work logs seeding (still used)
- `validateData.ts` - Data validation and consistency checks (still used)
- `migrateUserSlugs.ts` - Migration utility (still used)
- `realisticDataGenerators.ts` - Shared data generation utilities (still used)

## Restoration

If you need to restore these files for any reason:

```bash
# Copy a specific file back
cp server/src/scripts/obsolete-backup/seed.ts server/src/scripts/seed.ts

# Or restore all files
cp server/src/scripts/obsolete-backup/*.ts server/src/scripts/
```

## Safe to Delete?

These files can be safely deleted after:
1. Verifying the new consolidated system works correctly
2. Running all tests successfully
3. Confirming production deployment is stable
4. Keeping this backup for at least 30 days

**Recommended**: Keep this backup for 30-90 days before permanent deletion.

## New System Location

The new consolidated seeding system is located at:
```
server/src/scripts/consolidated-seed/
```

Key files:
- `cli.ts` - Command-line interface
- `SeedManager.ts` - Main seeding orchestrator
- `UserGenerator.ts` - User data generation
- `ProjectGenerator.ts` - Project data generation
- `ConfigurationManager.ts` - Configuration management
- `DataQualityValidator.ts` - Data quality validation
- `PerformanceMonitor.ts` - Performance tracking

## Documentation

For complete documentation on the new seeding system, see:
- `.kiro/specs/database-seeding-consolidation/` - Implementation specification
- `server/src/scripts/consolidated-seed/README.md` - System documentation
