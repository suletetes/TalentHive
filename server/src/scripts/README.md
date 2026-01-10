# TalentHive Seed Scripts

This directory contains comprehensive database seeding scripts for the TalentHive platform.

##  Quick Start

```bash
# Full comprehensive seed (recommended for development)
npm run seed

# Or use the flexible seed runner
npm run seed:all
```

##  Available Commands

### Full Seeding
```bash
npm run seed          # Main comprehensive seed
npm run seed:all      # Same as above, using seedAll.ts
```

### Partial Seeding
```bash
npm run seed:new      # New features only (profile slugs, onboarding, support tickets)
npm run seed:worklogs # Work logs only
npm run seed:roles    # Roles and permissions only
npm run seed:profiles # Complete profiles only
```

##  What Gets Seeded

### Full Seed (`npm run seed`)
- **Users** (55 total)
  - 1 Admin user
  - 20 Clients with realistic profiles
  - 34 Freelancers with complete profiles, work experience, education, languages
  - 3 Featured freelancers
- **RBAC System**
  - 48 Permissions (granular access control)
  - 4 System Roles (Super Admin, Moderator, Support Agent, Financial Manager)
  - Audit logs for permission changes
- **Categories & Skills**
  - 12 Categories (Web Dev, Mobile, UI/UX, etc.)
  - 76+ Skills mapped to categories
- **Organizations**
  - 6 Organizations with budgets and settings
- **Projects**
  - 96+ Projects with various statuses (open, in_progress, completed, cancelled, draft)
  - Realistic budgets, timelines, and requirements
- **Proposals**
  - 150+ Proposals with different statuses
  - Proper milestones and cover letters
- **Contracts**
  - 42 Active contracts with signatures
  - Proper milestone structures
  - Different source types (proposal, hire_now, service)
- **Reviews**
  - 74+ Reviews for freelancers and clients
  - Realistic ratings and feedback
- **Work Logs**
  - 179 Work log entries for time tracking
  - Completed and in-progress logs
  - 522+ total hours logged
- **Financial Data**
  - 3 Payments with Stripe integration
  - 10 Transactions with various statuses
  - Platform commission calculations
- **Communication**
  - 5 Messages across 2 conversations
  - 7 Notifications of different types
- **New Features**
  - Profile slugs for all users
  - Onboarding analytics
  - 20 Support tickets
  - Profile views and viewers

### Individual Seeds

#### New Features (`npm run seed:new`)
- Profile slugs for SEO-friendly URLs
- Onboarding completion status and analytics
- Support ticket system with sample tickets
- Profile view tracking

#### Work Logs (`npm run seed:worklogs`)
- Time tracking entries for active contracts
- Realistic work descriptions and hours
- Both completed and in-progress logs

#### Roles (`npm run seed:roles`)
- System permissions for all platform features
- Role-based access control setup
- Admin role assignments

#### Complete Profiles (`npm run seed:profiles`)
- Enhanced freelancer profiles
- Work experience and education history
- Language proficiencies

##  File Structure

```
server/src/scripts/
├── seed.ts                      # Main comprehensive seed
├── seedAll.ts                   # Flexible seed runner
├── seedNewFeatures.ts           # New features (slugs, onboarding, support)
├── seedWorkLogs.ts              # Work log entries
├── seedRoles.ts                 # RBAC roles
├── seedPermissions.ts           # RBAC permissions
├── seedWithCompleteProfiles.ts  # Enhanced user profiles
├── seedClientData.ts            # Additional client projects
├── seedEnhanced.ts              # Data enhancements
├── enhancedSeedData.ts          # Enhanced data generators
└── README.md                    # This file
```

##  Development Tips

### Environment Setup
Make sure your `.env` file has the correct MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017/talenthive_dev
```

### Database Reset
The full seed automatically clears all existing data. For partial seeds, data is additive.

### Testing Data
All seeded data uses:
- **Password**: `Password123!` for all users
- **Admin**: `admin@talenthive.com`
- **Sample Clients**: `john.client@example.com`, `sarah.manager@example.com`
- **Sample Freelancers**: `alice.dev@example.com`, `bob.designer@example.com`, etc.

### Performance
- Full seed takes ~10-15 seconds
- Individual seeds take 1-5 seconds
- All data is realistic and interconnected

##  Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

2. **TypeScript Compilation Error**
   ```bash
   # Clear and rebuild
   npm run build
   ```

3. **Duplicate Index Warnings**
   - These are harmless warnings about Mongoose schema indexes
   - They don't affect functionality

### Logs
All operations are logged with timestamps and emojis for easy tracking.

##  Use Cases

- **Development**: Use full seed for complete development environment
- **Testing**: Use individual seeds to test specific features
- **Demo**: Full seed provides realistic demo data
- **CI/CD**: Integrate seeds into automated testing pipelines

##  Data Quality

All seeded data is:
- **Realistic**: Based on actual freelancing platform patterns
- **Interconnected**: Proper relationships between entities
- **Diverse**: Various statuses, types, and scenarios
- **Complete**: All required fields populated
- **Consistent**: Follows platform business rules

This comprehensive seeding system ensures you have a fully functional TalentHive platform with realistic data for development, testing, and demonstration purposes.