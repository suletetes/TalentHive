# Platform Completion Spec

## Overview
This spec covers the implementation of critical features and bug fixes for the TalentHive platform, including admin communication system, profile enhancements with URL slugs, onboarding flows, and platform stability improvements.

## Goals
1. Implement admin-user communication system (support tickets with file attachments)
2. Add profile URL slugs for freelancers and clients with validation and redirects
3. Display completed projects and ratings on user profiles
4. Create role-specific onboarding flows with analytics
5. Fix favicon display across all pages
6. Fix organization field loading issue
7. Identify and fix platform bugs
8. Update seed data with new features
9. Add profile view tracking and analytics
10. Implement slug search functionality

## Non-Goals
- Writing automated test cases (will use manual testing scripts)
- Redesigning existing UI components
- Adding new payment features
- Implementing real-time chat (only support tickets)

## Architecture

### Database Schema Changes

#### User Model Updates
```typescript
// Add to existing User model
{
  profileSlug: { 
    type: String, 
    unique: true, 
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: 50
  },
  slugHistory: [{
    slug: String,
    changedAt: Date
  }],
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  onboardingSkippedAt: Date,
  profileViews: { type: Number, default: 0 },
  profileViewers: [{
    viewerId: { type: ObjectId, ref: 'User' },
    viewedAt: Date
  }]
}
```

#### New SupportTicket Model
```typescript
{
  ticketId: String (auto-generated, format: TKT-XXXXX),
  userId: ObjectId (ref: User),
  subject: String (required, max: 200),
  status: enum ['open', 'in-progress', 'resolved', 'closed'],
  priority: enum ['low', 'medium', 'high', 'urgent'],
  category: enum ['technical', 'billing', 'account', 'project', 'other'],
  messages: [{
    senderId: ObjectId (ref: User),
    message: String (required),
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    isAdminResponse: Boolean,
    isRead: Boolean,
    createdAt: Date
  }],
  assignedAdminId: ObjectId (ref: User),
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
  lastResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date
}
```

#### New OnboardingAnalytics Model
```typescript
{
  userId: ObjectId (ref: User),
  role: enum ['admin', 'freelancer', 'client'],
  startedAt: Date,
  completedAt: Date,
  skippedAt: Date,
  currentStep: Number,
  totalSteps: Number,
  stepsCompleted: [{
    stepNumber: Number,
    stepName: String,
    completedAt: Date,
    timeSpent: Number (seconds)
  }],
  dropOffStep: Number,
  completionRate: Number (percentage)
}
```

#### New ProfileSlugRedirect Model
```typescript
{
  oldSlug: String (indexed),
  newSlug: String,
  userId: ObjectId (ref: User),
  createdAt: Date,
  redirectCount: Number (default: 0),
  lastRedirectedAt: Date
}
```

### API Endpoints

#### Support Ticket Endpoints
- `POST /api/support/tickets` - Create new support ticket
- `GET /api/support/tickets` - Get user's tickets (or all for admin)
- `GET /api/support/tickets/:ticketId` - Get ticket details
- `POST /api/support/tickets/:ticketId/messages` - Add message to ticket
- `POST /api/support/tickets/:ticketId/attachments` - Upload file attachment
- `PATCH /api/support/tickets/:ticketId/status` - Update ticket status (admin only)
- `PATCH /api/support/tickets/:ticketId/assign` - Assign ticket to admin (admin only)
- `PATCH /api/support/tickets/:ticketId/tags` - Add/remove tags (admin only)
- `GET /api/support/tickets/stats` - Get ticket statistics (admin only)

#### Profile Slug Endpoints
- `GET /api/users/slug/:slug` - Get user by slug (handles redirects)
- `POST /api/users/slug/validate` - Validate slug availability
- `PATCH /api/users/profile/slug` - Update user's profile slug (creates redirect)
- `GET /api/users/slug/suggestions/:baseName` - Get slug suggestions
- `GET /api/users/slug/search` - Search users by slug (autocomplete)
- `GET /api/users/:userId/slug-history` - Get slug change history

#### Onboarding Endpoints
- `GET /api/onboarding/status` - Get user's onboarding status
- `PATCH /api/onboarding/step` - Update onboarding step
- `POST /api/onboarding/complete` - Mark onboarding as complete
- `POST /api/onboarding/skip` - Skip onboarding
- `GET /api/onboarding/analytics` - Get onboarding analytics (admin only)
- `GET /api/onboarding/analytics/:userId` - Get user's onboarding analytics

#### Profile Enhancement Endpoints
- `GET /api/freelancers/:slugOrId/profile` - Get freelancer profile with projects and ratings
- `GET /api/clients/:slugOrId/profile` - Get client profile with projects and ratings
- `GET /api/users/:userId/stats` - Get user statistics (completion rate, response time, etc.)
- `POST /api/users/:userId/profile-view` - Track profile view
- `GET /api/users/:userId/profile-views` - Get profile view analytics
- `GET /api/users/:userId/profile-viewers` - Get list of profile viewers

### Frontend Routes

#### Support System Routes
- `/dashboard/support` - Support tickets list
- `/dashboard/support/new` - Create new ticket
- `/dashboard/support/:ticketId` - Ticket details and conversation
- `/admin/support` - Admin support dashboard
- `/admin/support/:ticketId` - Admin ticket management

#### Profile Routes
- `/freelancer/:slug` - Public freelancer profile
- `/client/:slug` - Public client profile
- `/dashboard/profile/slug` - Edit profile slug

#### Onboarding Routes
- `/onboarding/freelancer` - Freelancer onboarding flow
- `/onboarding/client` - Client onboarding flow
- `/onboarding/admin` - Admin onboarding flow

## Implementation Plan

### Phase 1: Database Models and Backend Setup
1. Create SupportTicket model with file attachment support
2. Create OnboardingAnalytics model
3. Create ProfileSlugRedirect model
4. Update User model with profileSlug, onboarding, and analytics fields
5. Create database indexes for slug lookups and redirects
6. Add slug generation utility functions

### Phase 2: Support Ticket System
1. Implement support ticket controllers
2. Create support ticket routes
3. Add file upload endpoint for ticket attachments
4. Add email notifications for ticket events
5. Implement admin assignment logic
6. Add ticket tagging system
7. Create support ticket frontend components
8. Build ticket list and detail views
9. Add file attachment UI components
10. Add real-time notifications for new messages

### Phase 3: Profile URL Slugs
1. Implement slug validation logic
2. Create slug generation from names
3. Add slug suggestion algorithm
4. Implement slug redirect system (301 redirects)
5. Add slug history tracking
6. Build slug edit UI components
7. Update profile routes to support slug-based URLs
8. Add slug search/autocomplete functionality
9. Add slug migration for existing users

### Phase 4: Profile Enhancements
1. Create profile statistics calculation service
2. Implement profile view tracking system
3. Build freelancer profile view with projects and ratings
4. Build client profile view with projects and ratings
5. Add rating distribution visualization
6. Implement completion rate and response time calculations
7. Add profile view analytics dashboard
8. Add profile viewer list component
9. Update profile pages with new data

### Phase 5: Onboarding Flows
1. Design onboarding step components
2. Create freelancer onboarding wizard (profile setup, skills, portfolio)
3. Create client onboarding wizard (company info, project preferences)
4. Create admin onboarding (platform overview, admin tools)
5. Implement onboarding progress tracking
6. Add skip and resume functionality
7. Create onboarding reminder system
8. Implement onboarding analytics tracking
9. Build admin onboarding analytics dashboard
10. Add drop-off point identification

### Phase 6: Advanced Features
1. Implement slug redirect middleware
2. Add slug search/autocomplete API
3. Build file attachment upload for support tickets
4. Add ticket tagging system
5. Create ticket statistics dashboard for admins
6. Implement profile completeness indicator
7. Add onboarding completion rate tracking

### Phase 7: Bug Fixes and Improvements
1. Fix favicon display (add to index.html and all routes)
2. Fix organization field loading in project creation
3. Audit error handling across all API endpoints
4. Add loading states to all async operations
5. Improve validation error messages
6. Fix any console errors and warnings
7. Test all user flows for edge cases

### Phase 8: Seed Data Updates
1. Add profile slugs to seed users
2. Create support ticket seed data with attachments
3. Add onboarding status to seed users
4. Generate realistic project history for freelancers
5. Generate realistic project history for clients
6. Add rating distributions to seed data
7. Add profile view data to seed
8. Add slug redirect history to seed

### Phase 9: Testing and Validation
1. Create manual testing scripts for each feature
2. Test support ticket creation with file attachments
3. Test slug validation, uniqueness, and redirects
4. Test profile views with projects and ratings
5. Test profile view tracking
6. Test onboarding flows for all roles
7. Test onboarding analytics
8. Test slug search functionality
9. Test error handling and edge cases
10. Verify seed data completeness

## Technical Details

### Slug Generation Algorithm
```javascript
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function generateUniqueSuggestions(baseSlug, existingSlugs) {
  const suggestions = [baseSlug];
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${baseSlug}-${i}`);
    suggestions.push(`${baseSlug}-${Math.random().toString(36).substring(2, 6)}`);
  }
  return suggestions.filter(s => !existingSlugs.includes(s)).slice(0, 5);
}

async function handleSlugChange(userId, oldSlug, newSlug) {
  // Create redirect entry
  await ProfileSlugRedirect.create({
    oldSlug,
    newSlug,
    userId,
    createdAt: new Date()
  });
  
  // Update user's slug history
  await User.findByIdAndUpdate(userId, {
    $push: {
      slugHistory: {
        slug: oldSlug,
        changedAt: new Date()
      }
    }
  });
}
```

### Slug Redirect Middleware
```javascript
async function slugRedirectMiddleware(req, res, next) {
  const { slug } = req.params;
  
  // Check if slug exists as redirect
  const redirect = await ProfileSlugRedirect.findOne({ oldSlug: slug });
  
  if (redirect) {
    // Update redirect stats
    await ProfileSlugRedirect.findByIdAndUpdate(redirect._id, {
      $inc: { redirectCount: 1 },
      lastRedirectedAt: new Date()
    });
    
    // Return 301 redirect
    return res.redirect(301, `/profile/${redirect.newSlug}`);
  }
  
  next();
}
```

### File Upload for Support Tickets
```javascript
// Multer configuration for ticket attachments
const ticketUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload to Cloudinary
async function uploadTicketAttachment(file) {
  const result = await cloudinary.uploader.upload(file.buffer, {
    folder: 'support-tickets',
    resource_type: 'auto'
  });
  
  return {
    filename: file.originalname,
    url: result.secure_url,
    size: file.size,
    mimeType: file.mimetype
  };
}
```

### Profile Statistics Calculations
```javascript
// Freelancer stats
- Completion Rate: (completed projects / total projects) * 100
- Average Rating: sum(ratings) / count(ratings)
- Response Time: average time to first response on proposals
- On-Time Delivery: (on-time projects / completed projects) * 100
- Profile Views: total count of profile views
- Unique Viewers: count of unique users who viewed profile

// Client stats
- Total Projects Posted: count of all projects
- Active Contracts: count of in-progress contracts
- Average Project Budget: sum(budgets) / count(projects)
- Average Rating: ratings from freelancers
```

### Notification Strategy
- Email notifications for:
  - New support ticket (to all admins)
  - Support ticket response (to ticket creator)
  - Ticket status change (to ticket creator)
- In-app notifications for:
  - New support ticket message
  - Ticket assignment (to assigned admin)
  - Onboarding reminders (if not completed after 7 days)

## UI Components

### Support Ticket Components
- `SupportTicketList` - List of user's tickets with status badges
- `SupportTicketCard` - Individual ticket preview card
- `CreateTicketForm` - Form to create new ticket with file upload
- `TicketConversation` - Message thread display
- `TicketMessageInput` - Input for new messages
- `TicketFileUpload` - File attachment upload component
- `TicketAttachmentList` - Display attached files
- `TicketTagManager` - Manage ticket tags (admin only)
- `AdminTicketDashboard` - Admin view of all tickets
- `TicketStatusBadge` - Visual status indicator
- `TicketPriorityBadge` - Visual priority indicator
- `AdminBadge` - Badge to identify admin responses
- `TicketStatistics` - Admin ticket statistics dashboard

### Profile Components
- `ProfileSlugEditor` - Edit and validate profile slug
- `SlugSuggestions` - Display alternative slug options
- `SlugSearchAutocomplete` - Search profiles by slug
- `SlugHistoryList` - Display slug change history
- `FreelancerProfileView` - Enhanced freelancer profile
- `ClientProfileView` - Enhanced client profile
- `ProjectHistoryCard` - Display completed projects
- `RatingDistribution` - Visual rating breakdown
- `ProfileStatistics` - Display user stats (completion rate, etc.)
- `ProfileViewTracker` - Track profile views
- `ProfileViewAnalytics` - Display profile view statistics
- `ProfileViewersList` - List of users who viewed profile
- `ProfileCompletenessIndicator` - Show profile completion percentage

### Onboarding Components
- `OnboardingWizard` - Multi-step wizard container
- `OnboardingProgress` - Progress indicator
- `FreelancerOnboardingSteps` - Freelancer-specific steps
- `ClientOnboardingSteps` - Client-specific steps
- `AdminOnboardingSteps` - Admin-specific steps
- `OnboardingSkipDialog` - Confirmation dialog for skipping
- `OnboardingReminderBanner` - Reminder to complete onboarding
- `OnboardingAnalyticsDashboard` - Admin view of onboarding metrics
- `OnboardingDropOffChart` - Visualize where users drop off

## Testing Scripts

### Manual Testing Script Structure
```javascript
// test-support-tickets.js
// test-profile-slugs.js
// test-onboarding-flows.js
// test-profile-enhancements.js
// test-bug-fixes.js
```

Each script will:
1. Set up test data
2. Execute feature operations
3. Verify expected outcomes
4. Log results
5. Clean up test data

## Success Criteria
- [ ] Users can create and manage support tickets with file attachments
- [ ] Admins receive notifications for new tickets
- [ ] Admins can respond to tickets, update status, and add tags
- [ ] Ticket statistics dashboard working for admins
- [ ] Freelancers and clients have unique profile slugs
- [ ] Slugs can be edited with proper validation
- [ ] Old slugs redirect to new slugs (301 redirects)
- [ ] Slug search/autocomplete functionality working
- [ ] Slug history tracked and viewable
- [ ] Freelancer profiles display completed projects and ratings
- [ ] Client profiles display posted projects and ratings
- [ ] Profile view tracking working
- [ ] Profile view analytics displayed
- [ ] Profile completeness indicator showing
- [ ] All three roles have functional onboarding flows
- [ ] Onboarding analytics tracked
- [ ] Admin can view onboarding completion rates and drop-off points
- [ ] Favicon displays on all pages
- [ ] Organization field loads correctly in project creation
- [ ] No console errors or unhandled exceptions
- [ ] Seed data includes all new features
- [ ] All manual testing scripts pass

## Risks and Mitigations

### Risk: Slug conflicts during migration
**Mitigation**: Generate unique slugs with fallback numbering system

### Risk: Performance issues with profile statistics
**Mitigation**: Cache statistics and update on relevant events

### Risk: Email notification spam
**Mitigation**: Implement rate limiting and digest options

### Risk: Onboarding interruption
**Mitigation**: Save progress at each step, allow resume

## Timeline Estimate
- Phase 1: 3 hours (additional models)
- Phase 2: 8 hours (file uploads, tagging)
- Phase 3: 6 hours (redirects, search)
- Phase 4: 7 hours (view tracking, analytics)
- Phase 5: 8 hours (analytics tracking)
- Phase 6: 6 hours (advanced features)
- Phase 7: 4 hours (bug fixes)
- Phase 8: 4 hours (enhanced seed data)
- Phase 9: 5 hours (comprehensive testing)

**Total: ~51 hours (approximately 6-7 weeks)**

## Dependencies
- Existing User, Project, Contract, Review models
- Email service (SendGrid)
- Notification system
- Authentication middleware
- File upload service (Cloudinary) for ticket attachments

## Open Questions
1. Should support tickets be visible to other users? (Answer: No, private only)
2. Maximum number of open tickets per user? (Answer: No limit, but rate limit creation)
3. Should slug changes redirect old URLs? (Answer: Yes, implement 301 redirects)
4. Can users skip onboarding permanently? (Answer: Yes, but show reminder banner)
5. Should admins be able to message users directly outside tickets? (Answer: No, use tickets only)
