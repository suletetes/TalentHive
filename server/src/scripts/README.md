# TalentHive Database Scripts

This directory contains database seeding, migration, and validation scripts for the TalentHive platform.

## Quick Start

### Seed Database (Recommended)
```bash
# From project root
npm run seed

# From server directory
npm run seed
```

This uses the new consolidated seeding system with realistic, market-based data.

## Directory Structure

```
scripts/
├── consolidated-seed/       # New unified seeding system
│   ├── cli.ts              # Command-line interface
│   ├── SeedManager.ts      # Main orchestrator
│   ├── UserGenerator.ts    # User data generation
│   ├── ProjectGenerator.ts # Project data generation
│   ├── ConfigurationManager.ts
│   ├── DataQualityValidator.ts
│   └── ... (other modules)
├── obsolete-backup/        # Old seed scripts (backed up)
├── seedPermissions.ts      # System permissions seeding
├── seedRoles.ts           # System roles seeding
├── seedWorkLogs.ts        # Work logs seeding
├── validateData.ts        # Data validation utility
└── migrateUserSlugs.ts    # Slug migration utility
```

## Available Commands

### Seeding Commands

#### Basic Seeding
```bash
npm run seed              # Seed with development environment
npm run seed:dev          # Explicitly seed development data
npm run seed:demo         # Seed demo environment data
npm run seed:testing      # Seed testing environment data
```

#### Database Management
```bash
npm run seed:status       # Check database status
npm run seed:clean        # Clean all seeded data
npm run seed:quality      # Run data quality checks
npm run seed:config       # View current configuration
```

#### Specific Data Types
```bash
npm run seed:permissions  # Seed system permissions only
npm run seed:roles        # Seed system roles only
npm run seed:worklogs     # Seed work logs only
```

### Data Validation Commands

```bash
npm run validate-data           # Interactive validation menu
npm run validate-data:check     # Check data consistency
npm run validate-data:fix       # Fix data inconsistencies
npm run validate-data:stats     # View database statistics
```

### Testing Commands

```bash
npm run test:performance        # Run performance tests
npm run test:integration        # Run integration tests
npm run test:final-checkpoint   # Run final validation
```

## Consolidated Seeding System

The new consolidated seeding system provides:

### Features
- **Realistic Data**: Market-based rates, skill combinations, and project budgets
- **Automatic Slug Generation**: Unique, SEO-friendly user slugs with conflict resolution
- **Batch Processing**: Efficient database operations with configurable batch sizes
- **Data Quality Validation**: Built-in validation and quality metrics
- **Environment Configurations**: Different data sets for dev, testing, and demo
- **Progress Tracking**: Real-time progress indicators
- **Error Handling**: Comprehensive error recovery and cleanup

### Configuration

Configurations are managed through `ConfigurationManager` with three environments:

#### Development Environment
- 3 admins
- 25 clients
- 50 freelancers
- 58 projects (various statuses)
- Realistic proposals, contracts, and reviews

#### Testing Environment
- 2 admins
- 10 clients
- 20 freelancers
- Smaller dataset for faster tests

#### Demo Environment
- 3 admins
- 15 clients
- 30 freelancers
- Curated data for demonstrations

### CLI Usage

The consolidated system provides a powerful CLI:

```bash
# Interactive seeding
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts seed

# With options
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts seed \
  --environment development \
  --batch-size 100 \
  --quality-check

# Dry run (preview without seeding)
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts seed --dry-run

# Configuration management
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts config show
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts config validate
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts config create

# Quality checks
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts quality check \
  --export quality-report.json \
  --threshold 80

# Performance validation
ts-node -r tsconfig-paths/register src/scripts/consolidated-seed/cli.ts performance validate
```

## Individual Scripts

### seedPermissions.ts
Seeds system permissions for RBAC (Role-Based Access Control).

**Usage:**
```bash
npm run seed:permissions
```

**Permissions include:**
- User management (create, read, update, delete, suspend, verify)
- Project management (create, read, update, delete, moderate)
- Contract management (create, read, update, approve, moderate)
- Payment management (create, read, refund, manage)
- Review management (create, read, update, delete, moderate)
- And more...

### seedRoles.ts
Seeds system roles with appropriate permissions.

**Usage:**
```bash
npm run seed:roles
```

**Roles include:**
- Super Admin (all permissions)
- Moderator (content moderation and user management)
- Support Agent (customer support and ticket management)
- Financial Manager (payment and transaction management)

### seedWorkLogs.ts
Seeds work log entries for active contracts.

**Usage:**
```bash
npm run seed:worklogs
```

**Features:**
- Creates 8-15 work logs per active contract
- Realistic time entries over the last 60 days
- Completed and in-progress logs
- Proper duration calculations

### validateData.ts
Validates and fixes data consistency issues.

**Usage:**
```bash
# Check only
npm run validate-data:check

# Check and fix
npm run validate-data:fix

# View statistics
npm run validate-data:stats
```

**Validates:**
- User ratings accuracy
- Contract amounts and totals
- Referential integrity (foreign keys)
- Data consistency across collections

### migrateUserSlugs.ts
Migration utility for adding slugs to existing users.

**Usage:**
```bash
ts-node -r tsconfig-paths/register src/scripts/migrateUserSlugs.ts
```

## Data Generation

### Realistic Data Features

The consolidated system generates realistic data based on market research:

#### User Generation
- Market-based hourly rates by category and experience level
- Location-based rate adjustments (San Francisco, New York, etc.)
- Realistic skill combinations by job title
- Complete profiles with work experience, education, certifications
- Portfolio items aligned with skills
- Proper language proficiency levels

#### Project Generation
- Budget calculations based on complexity and required skills
- Seasonal posting patterns (higher activity in Q1, Q4)
- Realistic project descriptions and requirements
- Proper status distribution (open, in progress, completed, cancelled)

#### Relationship Generation
- Proposals linked to appropriate projects and freelancers
- Contracts only for accepted proposals
- Reviews only for completed contracts
- Accurate rating calculations

### Slug Generation

Automatic slug generation with:
- SEO-friendly format (lowercase, hyphens, no special chars)
- Uniqueness enforcement with conflict resolution
- Format validation (3-50 characters, no reserved words)
- Automatic suffixes for duplicates (john-smith, john-smith-1, etc.)

## Performance

The consolidated system is optimized for performance:

- **Batch Processing**: Inserts data in configurable batches (default: 100)
- **Parallel Generation**: Generates data in parallel where possible
- **Efficient Queries**: Minimizes database round trips
- **Progress Tracking**: Real-time progress indicators
- **Target**: Complete seeding in under 2 minutes for development environment

## Testing

### Performance Tests
```bash
npm run test:performance
```

Validates that seeding completes within time requirements.

### Integration Tests
```bash
npm run test:integration
```

Tests complete seeding workflow across all environments.

### Final Checkpoint
```bash
npm run test:final-checkpoint
```

Comprehensive validation of all requirements and system health.

## Troubleshooting

### Seeding Fails
1. Check MongoDB connection
2. Ensure database is accessible
3. Check for sufficient disk space
4. Review error logs

### Slow Performance
1. Reduce batch size: `--batch-size 50`
2. Check database indexes
3. Ensure adequate system resources
4. Run performance tests to identify bottlenecks

### Data Quality Issues
1. Run quality check: `npm run seed:quality`
2. Validate data: `npm run validate-data:check`
3. Fix issues: `npm run validate-data:fix`

### Duplicate Slugs
The system automatically handles slug conflicts. If issues persist:
1. Run slug migration: `ts-node -r tsconfig-paths/register src/scripts/migrateUserSlugs.ts`
2. Check for manual slug assignments in code
3. Verify slug validation is enabled

## Migration from Old System

Old seed scripts have been moved to `obsolete-backup/`. See `obsolete-backup/README.md` for:
- List of obsolete files
- Restoration instructions
- Migration notes
- Deletion guidelines

## Best Practices

1. **Always use the consolidated system** for new seeding
2. **Run quality checks** after seeding: `npm run seed:quality`
3. **Validate data** periodically: `npm run validate-data:check`
4. **Use appropriate environment** for your use case
5. **Clean database** before re-seeding: `npm run seed:clean`
6. **Monitor performance** with performance tests
7. **Keep backups** before major data operations

## Contributing

When adding new data generators:

1. Implement the `DataGenerator` interface
2. Add to `SeedManager` orchestration
3. Include validation logic
4. Add tests (unit and property-based)
5. Update configuration options
6. Document in this README

## Support

For issues or questions:
1. Check this README
2. Review `consolidated-seed/README.md`
3. Check `.kiro/specs/database-seeding-consolidation/`
4. Review error logs
5. Contact the development team

## License

MIT License - See LICENSE file for details
