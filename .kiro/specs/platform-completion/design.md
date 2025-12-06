# TalentHive Platform Completion - Design

## System Architecture

### Payment System Design

#### Commission Configuration
```typescript
interface PlatformSettings {
  commission: {
    percentage: number; // Default 20%
    type: 'percentage' | 'fixed';
    minimumAmount: number;
    maximumAmount: number;
  };
  payment: {
    currency: string;
    escrowPeriod: number; // days
    autoRelease: boolean;
  };
}
```

#### Payment Flow
```
1. Client approves milestone
   ↓
2. Payment intent created (Stripe)
   ↓
3. Client pays via Stripe
   ↓
4. Funds held in escrow
   ↓
5. Platform calculates commission
   ↓
6. After escrow period:
   - Platform commission → Platform account
   - Remaining amount → Freelancer account
   ↓
7. Email notifications sent
   ↓
8. Transaction recorded in database
```

#### Database Schema Updates

**PlatformSettings Model**
```typescript
{
  _id: ObjectId,
  commission: {
    percentage: Number,
    type: String,
    minimumAmount: Number,
    maximumAmount: Number
  },
  payment: {
    currency: String,
    escrowPeriod: Number,
    autoRelease: Boolean
  },
  updatedBy: ObjectId,
  updatedAt: Date
}
```

**Transaction Model**
```typescript
{
  _id: ObjectId,
  contract: ObjectId,
  milestone: ObjectId,
  amount: Number,
  platformCommission: Number,
  freelancerAmount: Number,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  stripePaymentIntentId: String,
  stripeTransferId: String,
  client: ObjectId,
  freelancer: ObjectId,
  paidAt: Date,
  releasedAt: Date,
  createdAt: Date
}
```

### Verification System Design

#### Email Verification Flow
```
1. User registers
   ↓
2. Verification token generated
   ↓
3. Email sent with verification link
   ↓
4. User clicks link
   ↓
5. Token validated
   ↓
6. User.isVerified = true
   ↓
7. Blue tick badge displayed
```

#### Verification Levels
```typescript
enum VerificationLevel {
  NONE = 'none',           // Just registered
  EMAIL = 'email',         // Email verified (blue tick)
  PHONE = 'phone',         // Phone verified
  IDENTITY = 'identity',   // ID verified
  PAYMENT = 'payment',     // Payment method verified
  PREMIUM = 'premium'      // All verifications + premium
}
```

### Notification System Design

#### Notification Types
```typescript
interface Notification {
  _id: ObjectId;
  user: ObjectId;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    projectId?: ObjectId;
    proposalId?: ObjectId;
    contractId?: ObjectId;
    senderId?: ObjectId;
  };
  createdAt: Date;
}
```

#### Real-time Notification Flow
```
1. Event occurs (new message, proposal, etc.)
   ↓
2. Notification created in database
   ↓
3. Socket.io emits to user's room
   ↓
4. Frontend receives notification
   ↓
5. Badge count updated
   ↓
6. Toast notification shown
   ↓
7. Notification appears in dropdown
```

### Organization System Design

#### Organization Structure
```typescript
interface Organization {
  _id: ObjectId;
  name: string;
  description: string;
  logo: string;
  owner: ObjectId;
  members: Array<{
    user: ObjectId;
    role: 'owner' | 'admin' | 'member';
    permissions: string[];
    joinedAt: Date;
  }>;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    currency: string;
  };
  settings: {
    requireApproval: boolean;
    maxProjectBudget: number;
    allowedCategories: ObjectId[];
  };
  projects: ObjectId[];
  createdAt: Date;
}
```

### Contract Management Design

#### Contract Lifecycle
```
1. Proposal Accepted
   ↓
2. Contract Auto-Generated
   - Terms from proposal
   - Milestones copied
   - Payment schedule set
   ↓
3. Contract Active
   - Freelancer works
   - Submits milestones
   - Client reviews
   ↓
4. Milestone Approval
   - Client approves
   - Payment processed
   - Next milestone starts
   ↓
5. Contract Completion
   - All milestones done
   - Final payment released
   - Review requested
   ↓
6. Contract Closed
```

#### Contract States
```typescript
enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  IN_DISPUTE = 'in_dispute',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated'
}

enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}
```

### Messaging Enhancement Design

#### Message Features
```typescript
interface Message {
  _id: ObjectId;
  conversation: ObjectId;
  sender: ObjectId;
  content: string;
  attachments: Array<{
    type: 'image' | 'document' | 'video';
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }>;
  replyTo?: ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: Array<{
    user: ObjectId;
    readAt: Date;
  }>;
  reactions: Array<{
    user: ObjectId;
    emoji: string;
  }>;
  createdAt: Date;
}
```

#### File Upload Flow
```
1. User selects file
   ↓
2. Frontend validates (size, type)
   ↓
3. Upload to Cloudinary/S3
   ↓
4. Get secure URL
   ↓
5. Create message with attachment
   ↓
6. Socket.io broadcasts
   ↓
7. Recipients see file
```

### Admin Analytics Design

#### Chart Components
```typescript
// Revenue Chart
interface RevenueData {
  date: string;
  revenue: number;
  commission: number;
  payouts: number;
}

// User Growth Chart
interface UserGrowthData {
  date: string;
  freelancers: number;
  clients: number;
  total: number;
}

// Project Stats
interface ProjectStats {
  status: string;
  count: number;
  percentage: number;
}
```

#### Dashboard Widgets
1. **Revenue Overview**
   - Line chart (last 30 days)
   - Total revenue
   - Commission earned
   - Growth percentage

2. **User Statistics**
   - Area chart (user growth)
   - Active users
   - New registrations
   - Retention rate

3. **Project Metrics**
   - Pie chart (project status)
   - Completion rate
   - Average project value
   - Success rate

4. **Payment Analytics**
   - Bar chart (monthly payments)
   - Total processed
   - Pending payouts
   - Failed transactions

## API Endpoints Design

### Payment Endpoints
```
POST   /api/v1/payments/create-intent
POST   /api/v1/payments/confirm
POST   /api/v1/payments/release
GET    /api/v1/payments/transactions
POST   /api/v1/payments/refund
GET    /api/v1/payments/balance
```

### Settings Endpoints
```
GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings/commission
PUT    /api/v1/admin/settings/payment
GET    /api/v1/admin/settings/history
```

### Notification Endpoints
```
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
POST   /api/v1/notifications/preferences
```

### Organization Endpoints
```
POST   /api/v1/organizations
GET    /api/v1/organizations
GET    /api/v1/organizations/:id
PUT    /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
POST   /api/v1/organizations/:id/members
DELETE /api/v1/organizations/:id/members/:userId
PUT    /api/v1/organizations/:id/budget
GET    /api/v1/organizations/:id/projects
```

### Contract Endpoints
```
GET    /api/v1/contracts
GET    /api/v1/contracts/:id
PUT    /api/v1/contracts/:id/status
POST   /api/v1/contracts/:id/milestones/:milestoneId/submit
PUT    /api/v1/contracts/:id/milestones/:milestoneId/approve
PUT    /api/v1/contracts/:id/milestones/:milestoneId/reject
POST   /api/v1/contracts/:id/dispute
PUT    /api/v1/contracts/:id/amend
```

### Verification Endpoints
```
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
POST   /api/v1/verification/phone
POST   /api/v1/verification/identity
GET    /api/v1/verification/status
```

## Frontend Components Design

### Payment Components
- `PaymentForm.tsx` - Stripe payment form
- `PaymentSuccess.tsx` - Success page
- `PaymentError.tsx` - Error page
- `PaymentHistory.tsx` - Transaction list
- `EscrowStatus.tsx` - Escrow timer display

### Notification Components
- `NotificationBell.tsx` - Bell icon with badge
- `NotificationDropdown.tsx` - Notification list
- `NotificationItem.tsx` - Single notification
- `NotificationPreferences.tsx` - Settings

### Organization Components
- `OrganizationList.tsx` - List of organizations
- `OrganizationCard.tsx` - Organization preview
- `OrganizationForm.tsx` - Create/edit form
- `OrganizationDashboard.tsx` - Org dashboard
- `MemberManagement.tsx` - Member list/invite
- `BudgetManager.tsx` - Budget controls

### Contract Components
- `ContractList.tsx` - All contracts
- `ContractDetail.tsx` - Contract view
- `MilestoneCard.tsx` - Milestone display
- `MilestoneSubmission.tsx` - Submit work
- `MilestoneReview.tsx` - Review submission
- `ContractTimeline.tsx` - Progress timeline
- `DisputeForm.tsx` - Dispute filing

### Admin Components
- `AnalyticsDashboard.tsx` - Main dashboard
- `RevenueChart.tsx` - Revenue visualization
- `UserGrowthChart.tsx` - User metrics
- `ProjectStatsChart.tsx` - Project analytics
- `SettingsPanel.tsx` - Platform settings
- `CommissionSettings.tsx` - Commission config

### Messaging Components
- `FileUpload.tsx` - File attachment
- `MessageAttachment.tsx` - Display attachment
- `MessageEditor.tsx` - Edit message
- `TypingIndicator.tsx` - Typing status
- `ReadReceipts.tsx` - Read status
- `MessageSearch.tsx` - Search messages

## Security Considerations

### Payment Security
- PCI DSS compliance via Stripe
- No card data stored locally
- Webhook signature verification
- Transaction idempotency
- Fraud detection integration

### Data Protection
- Encrypted file storage
- Secure file URLs with expiration
- Rate limiting on uploads
- Virus scanning for files
- GDPR compliance

### Access Control
- Role-based permissions
- Organization-level access
- Contract participant verification
- Admin action logging
- API key rotation

## Performance Optimization

### Database Optimization
- Indexed queries for analytics
- Aggregation pipelines for stats
- Caching for settings
- Connection pooling
- Query optimization

### Frontend Optimization
- Code splitting by route
- Lazy loading components
- Image optimization
- Chart data pagination
- Virtual scrolling for lists

### Real-time Optimization
- Socket.io room management
- Selective event broadcasting
- Connection pooling
- Heartbeat monitoring
- Reconnection handling
