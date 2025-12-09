# Testing Guide - Platform Completion Features

## Overview
This guide provides manual testing scripts and procedures for all new features.

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend running on http://localhost:3000
- MongoDB running with seed data
- Postman or similar API testing tool
- Test user accounts (admin, freelancer, client)

---

## Test 1: Support Ticket System

### Backend API Testing

#### 1.1 Create Support Ticket
```javascript
// POST /api/support/tickets
{
  "subject": "Payment Issue",
  "category": "billing",
  "priority": "high",
  "message": "I cannot process my payment for project #123"
}

// Expected Response:
{
  "success": true,
  "ticket": {
    "ticketId": "TKT-001",
    "status": "open",
    "subject": "Payment Issue",
    "createdAt": "2025-12-08T..."
  }
}
```

#### 1.2 Get User Tickets
```javascript
// GET /api/support/tickets
// Expected: Array of user's tickets with status, subject, lastResponseAt
```

#### 1.3 Get Ticket Details
```javascript
// GET /api/support/tickets/TKT-001
// Expected: Full ticket with messages array
```

#### 1.4 Add Message to Ticket
```javascript
// POST /api/support/tickets/TKT-001/messages
{
  "message": "I tried again but still getting error"
}

// Expected: Updated ticket with new message
```

#### 1.5 Admin: Update Ticket Status
```javascript
// PATCH /api/support/tickets/TKT-001/status
{
  "status": "in-progress"
}

// Expected: Ticket status updated, user notified
```

#### 1.6 Admin: Assign Ticket
```javascript
// PATCH /api/support/tickets/TKT-001/assign
{
  "adminId": "admin-user-id"
}

// Expected: Ticket assigned to admin
```

### Frontend Testing

#### 1.7 Create Ticket UI
- Navigate to /dashboard/support
- Click "Create New Ticket"
- Fill form with subject, category, priority, message
- Submit and verify ticket appears in list

#### 1.8 View Ticket List
- Verify tickets show status badges
- Verify last response date displays
- Verify message count shows
- Click ticket to view details

#### 1.9 Ticket Conversation
- View ticket detail page
- Verify messages display in chronological order
- Verify admin messages show admin badge
- Add new message and verify it appears

#### 1.10 Admin Dashboard
- Login as admin
- Navigate to /admin/support
- Verify all tickets from all users display
- Filter by status, priority, category
- Assign ticket to self
- Update ticket status
- Reply to ticket

### Expected Outcomes
- ✓ Tickets created successfully
- ✓ Email notifications sent to admins
- ✓ Users receive email when admin responds
- ✓ Admin badge displays on admin messages
- ✓ Ticket status updates correctly
- ✓ Real-time updates work (if Socket.io connected)

---

## Test 2: Profile URL Slugs

### Backend API Testing

#### 2.1 Validate Slug Availability
```javascript
// POST /api/users/slug/validate
{
  "slug": "john-developer"
}

// Expected if available:
{
  "available": true,
  "slug": "john-developer"
}

// Expected if taken:
{
  "available": false,
  "message": "Slug already taken"
}
```

#### 2.2 Get Slug Suggestions
```javascript
// GET /api/users/slug/suggestions/john-developer

// Expected:
{
  "suggestions": [
    "john-developer-1",
    "john-developer-2",
    "john-developer-abc",
    "john-dev",
    "john-developer-pro"
  ]
}
```

#### 2.3 Update User Slug
```javascript
// PATCH /api/users/profile/slug
{
  "slug": "john-developer"
}

// Expected:
{
  "success": true,
  "slug": "john-developer",
  "profileUrl": "/freelancer/john-developer"
}
```

#### 2.4 Get User by Slug
```javascript
// GET /api/users/slug/john-developer

// Expected: Full user profile
```

### Frontend Testing

#### 2.5 Edit Slug UI
- Navigate to profile settings
- Find "Profile URL" section
- Enter new slug
- Verify real-time validation
- If taken, verify suggestions appear
- Save and verify success message

#### 2.6 Slug Validation
- Try invalid characters (!@#$%)
- Try slug that's too long (>50 chars)
- Try existing slug
- Verify error messages display

#### 2.7 Profile Access via Slug
- Navigate to /freelancer/john-developer
- Verify profile loads correctly
- Try /client/company-name
- Verify client profile loads

### Expected Outcomes
- ✓ Slugs are unique across all users
- ✓ Invalid characters rejected
- ✓ Suggestions provided for taken slugs
- ✓ Profile accessible via slug URL
- ✓ Old URLs redirect to new slug (if implemented)

---

## Test 3: Profile Enhancements

### Backend API Testing

#### 3.1 Get Freelancer Profile with Stats
```javascript
// GET /api/freelancers/john-developer/profile

// Expected:
{
  "user": { ...userDetails },
  "stats": {
    "completionRate": 95,
    "averageRating": 4.8,
    "totalProjects": 42,
    "onTimeDelivery": 90,
    "responseTime": "2 hours"
  },
  "projects": [
    {
      "title": "E-commerce Website",
      "client": "ABC Corp",
      "rating": 5,
      "completedAt": "2025-11-15"
    }
  ],
  "ratingDistribution": {
    "5": 30,
    "4": 10,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

#### 3.2 Get Client Profile with Stats
```javascript
// GET /api/clients/company-name/profile

// Expected:
{
  "user": { ...userDetails },
  "stats": {
    "totalProjectsPosted": 15,
    "activeContracts": 3,
    "averageBudget": 5000,
    "averageRating": 4.5
  },
  "projects": [
    {
      "title": "Mobile App Development",
      "status": "completed",
      "freelancer": "John Developer",
      "budget": 8000
    }
  ]
}
```

### Frontend Testing

#### 3.3 Freelancer Profile View
- Navigate to freelancer profile
- Verify completion rate displays
- Verify average rating shows with stars
- Verify response time displays
- Verify on-time delivery percentage shows
- Scroll to "Completed Projects" section
- Verify projects list with client names and ratings
- Check rating distribution chart

#### 3.4 Client Profile View
- Navigate to client profile
- Verify total projects posted
- Verify active contracts count
- Verify average project budget
- Verify average rating from freelancers
- Scroll to "Posted Projects" section
- Verify projects list with status and freelancer names

### Expected Outcomes
- ✓ Statistics calculate correctly
- ✓ Project history displays
- ✓ Ratings aggregate properly
- ✓ Rating distribution visualizes correctly
- ✓ Performance metrics accurate

---

## Test 4: Onboarding Flows

### Backend API Testing

#### 4.1 Get Onboarding Status
```javascript
// GET /api/onboarding/status

// Expected:
{
  "onboardingCompleted": false,
  "currentStep": 2,
  "totalSteps": 5
}
```

#### 4.2 Update Onboarding Step
```javascript
// PATCH /api/onboarding/step
{
  "step": 3
}

// Expected: Step updated
```

#### 4.3 Complete Onboarding
```javascript
// POST /api/onboarding/complete

// Expected:
{
  "success": true,
  "onboardingCompleted": true
}
```

#### 4.4 Skip Onboarding
```javascript
// POST /api/onboarding/skip

// Expected: Onboarding marked as skipped
```

### Frontend Testing

#### 4.5 Freelancer Onboarding
- Register new freelancer account
- Verify redirect to /onboarding/freelancer
- Step 1: Complete profile (name, bio, avatar)
- Step 2: Add skills and expertise
- Step 3: Set hourly rate and availability
- Step 4: Add portfolio items
- Step 5: Review and complete
- Verify redirect to dashboard
- Verify onboarding marked complete

#### 4.6 Client Onboarding
- Register new client account
- Verify redirect to /onboarding/client
- Step 1: Complete profile (company name, description)
- Step 2: Add company details
- Step 3: Set project preferences
- Step 4: Review and complete
- Verify redirect to dashboard

#### 4.7 Admin Onboarding
- Create new admin account
- Verify redirect to /onboarding/admin
- Step 1: Platform overview
- Step 2: Admin tools introduction
- Step 3: Complete
- Verify redirect to admin dashboard

#### 4.8 Skip Onboarding
- Start onboarding
- Click "Skip for now"
- Verify confirmation dialog
- Confirm skip
- Verify redirect to dashboard
- Verify reminder banner shows

#### 4.9 Resume Onboarding
- Skip onboarding
- Click reminder banner
- Verify return to last step
- Complete onboarding

### Expected Outcomes
- ✓ Onboarding starts after registration
- ✓ Progress saves at each step
- ✓ Can skip and resume later
- ✓ Role-specific steps display
- ✓ Completion redirects correctly

---

## Test 5: Bug Fixes

### 5.1 Favicon Display
- Open application in browser
- Check browser tab for favicon
- Navigate to different pages
- Verify favicon persists
- Check on mobile devices

### 5.2 Organization Field Loading
- Login as client
- Navigate to /dashboard/projects/new
- Verify organization dropdown loads within 2 seconds
- Verify organizations display correctly
- Select organization
- Verify selection persists

### 5.3 Error Handling
- Disconnect internet
- Try to submit form
- Verify error message displays
- Reconnect internet
- Try invalid data
- Verify validation errors show

### 5.4 Loading States
- Navigate to data-heavy pages
- Verify loading spinners display
- Verify skeleton loaders show
- Verify no content flash

### 5.5 Console Errors
- Open browser console
- Navigate through application
- Verify no errors in console
- Verify no warnings (or only acceptable ones)

### Expected Outcomes
- ✓ Favicon displays everywhere
- ✓ Organization field loads properly
- ✓ Errors handled gracefully
- ✓ Loading states show
- ✓ No console errors

---

## Test 6: Seed Data Verification

### 6.1 Run Seed Script
```bash
npm run seed
```

### 6.2 Verify Seed Data
- Check users have profile slugs
- Check support tickets exist
- Check some users have onboarding completed
- Check freelancers have project history
- Check clients have posted projects
- Check ratings exist

### 6.3 Test with Seed Data
- Login with seed users
- Navigate to profiles
- Verify data displays correctly
- Test all features with seed data

---

## Regression Testing

### Critical Flows to Test
1. User registration and login
2. Project creation and posting
3. Proposal submission
4. Contract creation and management
5. Payment processing
6. Messaging system
7. Review and rating system
8. Admin user management

### Verify No Breaking Changes
- All existing features still work
- No data corruption
- No performance degradation
- No security vulnerabilities introduced

---

## Performance Testing

### Load Testing
- Test with 100+ users
- Test with 1000+ projects
- Test with 10000+ messages
- Verify response times < 2 seconds

### Database Performance
- Check query execution times
- Verify indexes are used
- Check for N+1 queries
- Optimize slow queries

---

## Security Testing

### Authentication
- Test JWT token expiration
- Test refresh token flow
- Test unauthorized access
- Test role-based access control

### Input Validation
- Test SQL injection attempts
- Test XSS attempts
- Test CSRF protection
- Test file upload restrictions

### Data Privacy
- Verify user data isolation
- Test admin access controls
- Verify sensitive data encryption
- Test data deletion

---

## Browser Compatibility

### Test on Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Test on Devices
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

---

## Checklist Summary

- [ ] All support ticket tests pass
- [ ] All profile slug tests pass
- [ ] All profile enhancement tests pass
- [ ] All onboarding tests pass
- [ ] All bug fixes verified
- [ ] Seed data complete and working
- [ ] No regression issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Cross-browser compatible
- [ ] Mobile responsive
- [ ] Documentation updated
