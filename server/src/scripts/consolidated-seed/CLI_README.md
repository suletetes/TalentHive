# TalentHive Database Seeding CLI

A unified command-line interface for database seeding operations in the TalentHive platform.

## Installation

The CLI is automatically available after setting up the consolidated seeding system. No additional installation required.

## Usage

### Basic Commands

```bash
# Full database seeding
npm run seed

# Seed with specific environment
npm run seed -- seed --environment demo

# Incremental updates
npm run seed -- update --add-users 10

# Show configuration
npm run seed -- config show

# Run quality check
npm run seed -- quality check
```

### Available Commands

#### `seed` - Full Database Seeding

Populate the database with comprehensive test data.

```bash
npm run seed -- seed [options]
```

**Options:**
- `-e, --environment <env>` - Environment (development|testing|demo) [default: development]
- `-c, --config <path>` - Custom configuration file path
- `--dry-run` - Show what would be seeded without actually seeding
- `--skip-existing` - Skip seeding if data already exists
- `--modules <modules>` - Comma-separated list of modules to seed
- `--batch-size <size>` - Batch size for database operations [default: 100]
- `--verbose` - Enable verbose logging
- `--quality-check` - Run data quality validation after seeding

**Examples:**
```bash
# Basic seeding
npm run seed -- seed

# Demo environment with quality check
npm run seed -- seed --environment demo --quality-check

# Seed only specific modules
npm run seed -- seed --modules users,projects,proposals

# Dry run to see what would be seeded
npm run seed -- seed --dry-run --verbose
```

#### `update` - Incremental Updates

Update existing data incrementally without full re-seeding.

```bash
npm run seed -- update [options]
```

**Options:**
- `-e, --environment <env>` - Environment [default: development]
- `--add-users <count>` - Add additional users
- `--add-projects <count>` - Add additional projects
- `--update-ratings` - Recalculate user ratings
- `--fix-slugs` - Fix missing or duplicate slugs
- `--verbose` - Enable verbose logging

**Examples:**
```bash
# Add 10 more users
npm run seed -- update --add-users 10

# Fix slug issues
npm run seed -- update --fix-slugs

# Recalculate all ratings
npm run seed -- update --update-ratings
```

#### `config` - Configuration Management

Manage seeding configurations for different environments.

```bash
npm run seed -- config <subcommand> [options]
```

**Subcommands:**
- `show` - Display current configuration
- `validate` - Validate configuration
- `create` - Create new configuration interactively

**Examples:**
```bash
# Show development configuration
npm run seed -- config show

# Validate demo configuration
npm run seed -- config validate --environment demo

# Create new configuration interactively
npm run seed -- config create --environment custom
```

#### `quality` - Data Quality Operations

Run data quality validation and generate reports.

```bash
npm run seed -- quality <subcommand> [options]
```

**Subcommands:**
- `check` - Run comprehensive data quality validation

**Options:**
- `--export <path>` - Export report to file
- `--threshold <score>` - Minimum quality score threshold [default: 70]

**Examples:**
```bash
# Basic quality check
npm run seed -- quality check

# Export detailed report
npm run seed -- quality check --export ./quality-report.json

# Check with custom threshold
npm run seed -- quality check --threshold 85
```

#### `migrate` - Migration Operations

Handle migration and consolidation of old seeding scripts.

```bash
npm run seed -- migrate <subcommand> [options]
```

**Subcommands:**
- `consolidate` - Consolidate old seeding scripts
- `rollback` - Rollback script consolidation

**Examples:**
```bash
# Consolidate old scripts
npm run seed -- migrate consolidate

# Rollback consolidation
npm run seed -- migrate rollback
```

#### `status` - System Status

Check database and seeding system status.

```bash
npm run seed -- status [options]
```

**Options:**
- `--detailed` - Show detailed status information

**Examples:**
```bash
# Basic status
npm run seed -- status

# Detailed status with counts
npm run seed -- status --detailed
```

#### `clean` - Database Cleanup

Remove all seeded data from the database.

```bash
npm run seed -- clean [options]
```

**Options:**
- `--confirm` - Skip confirmation prompt
- `--backup` - Create backup before cleaning

**Examples:**
```bash
# Clean with confirmation
npm run seed -- clean

# Clean with backup
npm run seed -- clean --backup

# Clean without confirmation (dangerous!)
npm run seed -- clean --confirm
```

## Configuration

### Environment-Based Configuration

The CLI supports three built-in environments:

- **development** - Comprehensive test data for development
- **testing** - Minimal data for CI/CD testing
- **demo** - Curated, presentation-ready data

### Custom Configuration

You can create custom configurations using:

```bash
npm run seed -- config create --environment custom
```

Or by providing a configuration file:

```bash
npm run seed -- seed --config ./my-config.json
```

### Environment Variables

Override configuration using environment variables:

```bash
SEED_ENVIRONMENT=demo
SEED_ADMIN_COUNT=5
SEED_CLIENT_COUNT=30
SEED_FREELANCER_COUNT=60
SEED_BATCH_SIZE=150
SEED_SKIP_EXISTING=true
SEED_ENABLE_MODULES=users,projects,proposals
```

## Data Quality

The CLI includes comprehensive data quality validation:

- **Format Consistency** - Validates email, URL, and date formats
- **Data Completeness** - Ensures required fields are populated
- **Realistic Distributions** - Checks data follows realistic patterns
- **Relationship Integrity** - Validates foreign key relationships

Quality scores range from 0-100:
- **70+** - Acceptable quality
- **85+** - Good quality
- **95+** - Excellent quality

## Performance

The seeding system is optimized for performance:

- **Batch Processing** - Efficient database operations
- **Parallel Generation** - Concurrent data generation
- **Progress Tracking** - Real-time progress indicators
- **Memory Management** - Optimized for large datasets

Typical performance:
- **Development** (78 users, 58 projects): ~30 seconds
- **Demo** (45 users, 34 projects): ~20 seconds
- **Testing** (16 users, 13 projects): ~10 seconds

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB is running
   npm run seed -- status
   ```

2. **Quality Check Failed**
   ```bash
   # Run detailed quality check
   npm run seed -- quality check --export ./report.json
   ```

3. **Seeding Timeout**
   ```bash
   # Reduce batch size
   npm run seed -- seed --batch-size 50
   ```

4. **Memory Issues**
   ```bash
   # Use smaller dataset
   npm run seed -- seed --environment testing
   ```

### Debug Mode

Enable verbose logging for debugging:

```bash
npm run seed -- seed --verbose
```

### Getting Help

```bash
# Show general help
npm run seed -- --help

# Show command-specific help
npm run seed -- seed --help
npm run seed -- config --help
```

## Integration

### Package.json Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "seed": "node server/src/scripts/consolidated-seed/cli.js",
    "seed:dev": "npm run seed -- seed --environment development",
    "seed:demo": "npm run seed -- seed --environment demo --quality-check",
    "seed:test": "npm run seed -- seed --environment testing",
    "seed:clean": "npm run seed -- clean --backup",
    "seed:status": "npm run seed -- status --detailed"
  }
}
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Seed Test Database
  run: npm run seed:test

- name: Validate Data Quality
  run: npm run seed -- quality check --threshold 80
```

### Docker Integration

```dockerfile
# Add to Dockerfile
RUN npm run seed:test
```

## Migration from Old Scripts

The CLI includes migration tools to consolidate old seeding scripts:

```bash
# Consolidate old scripts (creates backups)
npm run seed -- migrate consolidate

# Rollback if needed
npm run seed -- migrate rollback
```

This will:
- Extract useful functions from old scripts
- Update import statements
- Remove obsolete files (with backup)
- Generate migration documentation

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Run with `--verbose` for detailed logging
3. Use `npm run seed -- status` to check system health
4. Review the migration documentation in `MIGRATION_REPORT.md`