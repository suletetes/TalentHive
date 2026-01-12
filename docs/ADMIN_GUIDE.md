# TalentHive Admin Guide

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [User Management](#user-management)
3. [Project Management](#project-management)
4. [Payment Management](#payment-management)
5. [Analytics and Reporting](#analytics-and-reporting)
6. [Platform Settings](#platform-settings)
7. [Dispute Resolution](#dispute-resolution)
8. [Security and Compliance](#security-and-compliance)
9. [Troubleshooting](#troubleshooting)

---

## Admin Dashboard

### Dashboard Overview

The admin dashboard provides a comprehensive view of platform activity and key metrics.

**Key Sections**:

1. **Platform Overview**
   - Total users (Clients, Freelancers, Admins)
   - Active projects
   - Total revenue
   - Platform health status

2. **Recent Activity**
   - New user registrations
   - New projects posted
   - Recent transactions
   - Support tickets
   - Disputes filed

3. **Quick Actions**
   - View all users
   - View all projects
   - View all transactions
   - View support tickets
   - View disputes

### Accessing the Dashboard

1. Log in as admin
2. Click "Admin" in main navigation
3. Select "Dashboard"
4. View overview and metrics

---

## User Management

### Viewing Users

1. **Go to User Management**
   - Click Admin → Users
   - See list of all users

2. **Filter Users**
   - By role (Client, Freelancer, Admin)
   - By status (Active, Suspended, Deleted)
   - By verification status
   - By registration date

3. **Search Users**
   - Search by email
   - Search by name
   - Search by user ID

### User Details

1. **View User Profile**
   - Click user name
   - See full profile information
   - View account details
   - Check verification status

2. **User Information**
   - Email address
   - Registration date
   - Last login
   - Account status
   - Verification level
   - Total projects (if freelancer)
   - Total spent (if client)

3. **Activity History**
   - Recent projects
   - Recent proposals
   - Recent transactions
   - Messages sent
   - Reviews given

### Managing User Accounts

1. **Suspend User**
   - Click user profile
   - Click "Suspend Account"
   - Select reason
   - Set suspension duration
   - Click "Confirm"
   - User cannot access platform

2. **Activate Suspended User**
   - Click user profile
   - Click "Activate Account"
   - Confirm action
   - User regains access

3. **Delete User Account**
   - Click user profile
   - Click "Delete Account"
   - Confirm deletion
   - User data archived
   - Cannot be undone

4. **Reset Password**
   - Click user profile
   - Click "Reset Password"
   - Generate temporary password
   - Send to user email
   - User can change on next login

### Verification Management

1. **View Verification Status**
   - Click user profile
   - See verification level
   - View verification details

2. **Approve Verification**
   - Review submitted documents
   - Verify authenticity
   - Click "Approve"
   - User gets verification badge

3. **Reject Verification**
   - Review submitted documents
   - If invalid, click "Reject"
   - Provide reason
   - User can resubmit

### User Roles

1. **Change User Role**
   - Click user profile
   - Click "Change Role"
   - Select new role
   - Confirm change
   - User permissions updated

2. **Role Permissions**
   - **Client**: Post projects, hire freelancers, manage payments
   - **Freelancer**: Browse projects, submit proposals, deliver work
   - **Admin**: Full platform access, user management, settings

---

## Project Management

### Viewing Projects

1. **Go to Project Management**
   - Click Admin → Projects
   - See list of all projects

2. **Filter Projects**
   - By status (Open, In Progress, Completed, Cancelled)
   - By category
   - By date range
   - By budget range

3. **Search Projects**
   - Search by title
   - Search by client name
   - Search by project ID

### Project Details

1. **View Project**
   - Click project title
   - See full project details
   - View proposals
   - View contracts
   - View transactions

2. **Project Information**
   - Title and description
   - Client information
   - Budget and timeline
   - Skills required
   - Current status
   - Proposals received
   - Active contracts

### Managing Projects

1. **Flag Project**
   - Click project
   - Click "Flag Project"
   - Select reason (inappropriate content, spam, etc.)
   - Add notes
   - Project marked for review

2. **Remove Project**
   - Click project
   - Click "Remove Project"
   - Confirm removal
   - Project hidden from marketplace
   - Client notified

3. **Feature Project**
   - Click project
   - Click "Feature Project"
   - Set feature duration
   - Project appears in featured section

4. **Unfeature Project**
   - Click featured project
   - Click "Unfeature"
   - Project removed from featured

### Monitoring for Violations

1. **Review Flagged Projects**
   - Go to Admin → Flagged Content
   - Review each flagged project
   - Decide on action

2. **Common Violations**
   - Inappropriate content
   - Spam or scams
   - Duplicate projects
   - Misleading information
   - Copyright violations

3. **Taking Action**
   - Remove project
   - Suspend user
   - Send warning
   - Document violation

---

## Payment Management

### Viewing Transactions

1. **Go to Payment Management**
   - Click Admin → Payments
   - See all transactions

2. **Filter Transactions**
   - By status (Pending, Completed, Failed, Refunded)
   - By date range
   - By amount range
   - By user

3. **Search Transactions**
   - Search by transaction ID
   - Search by user name
   - Search by contract ID

### Transaction Details

1. **View Transaction**
   - Click transaction
   - See full details
   - View payment method
   - View commission breakdown
   - View status history

2. **Transaction Information**
   - Amount
   - Commission deducted
   - Freelancer amount
   - Payment method
   - Status
   - Timestamps

### Managing Payments

1. **Release Escrow Payment**
   - Click transaction
   - If status is "Escrow", click "Release"
   - Confirm release
   - Funds transferred to freelancer

2. **Refund Payment**
   - Click transaction
   - Click "Refund"
   - Confirm refund
   - Funds returned to client
   - Transaction marked as refunded

3. **Investigate Failed Payment**
   - Click failed transaction
   - View error details
   - Contact Stripe if needed
   - Retry payment if applicable

### Commission Management

1. **View Commission Settings**
   - Click Admin → Settings
   - Go to Commission section
   - See current commission rate

2. **Update Commission Rate**
   - Click "Edit Commission"
   - Enter new percentage
   - Click "Save"
   - Changes apply to new transactions

3. **Commission History**
   - View all commission changes
   - See who made changes
   - See when changes were made

---

## Analytics and Reporting

### Dashboard Analytics

1. **Revenue Analytics**
   - Total revenue
   - Commission earned
   - Payment trends
   - Monthly breakdown
   - Export data

2. **User Growth**
   - Total users
   - New registrations
   - Active users
   - User retention
   - Growth trends

3. **Project Statistics**
   - Total projects
   - Completion rate
   - Average project value
   - Category breakdown
   - Success rate

4. **Payment Analytics**
   - Total payments
   - Success rate
   - Failed transactions
   - Refunds
   - Average transaction value

### Generating Reports

1. **Create Report**
   - Click Admin → Reports
   - Select report type
   - Set date range
   - Click "Generate"

2. **Report Types**
   - Revenue Report
   - User Report
   - Project Report
   - Payment Report
   - Dispute Report
   - Custom Report

3. **Export Reports**
   - Click "Export"
   - Select format (PDF, CSV, Excel)
   - Download report
   - Share with stakeholders

### Data Analysis

1. **Identify Trends**
   - Monitor revenue trends
   - Track user growth
   - Analyze project categories
   - Identify popular skills

2. **Performance Metrics**
   - Project completion rate
   - Payment success rate
   - User retention rate
   - Customer satisfaction

3. **Forecasting**
   - Project revenue trends
   - User growth projections
   - Market analysis

---

## Platform Settings

### Commission Configuration

1. **Access Settings**
   - Click Admin → Settings
   - Go to Commission section

2. **Configure Commission**
   - Set commission percentage (default 20%)
   - Set minimum amount
   - Set maximum amount
   - Choose commission type (percentage or fixed)

3. **Save Changes**
   - Click "Save"
   - Changes apply to new transactions
   - Existing transactions unaffected

### Payment Settings

1. **Configure Payment Options**
   - Set accepted payment methods
   - Configure Stripe settings
   - Set escrow period
   - Enable/disable auto-release

2. **Stripe Configuration**
   - Enter Stripe API keys
   - Configure webhook URL
   - Test connection
   - Save settings

### Email Configuration

1. **Email Templates**
   - Go to Email Templates
   - View all templates
   - Edit templates
   - Preview changes

2. **Notification Settings**
   - Configure notification emails
   - Set email frequency
   - Enable/disable notifications
   - Test email delivery

### Security Settings

1. **Rate Limiting**
   - Set API rate limits
   - Configure login attempts
   - Set password requirements
   - Enable two-factor authentication

2. **API Keys**
   - Generate API keys
   - Manage API keys
   - Revoke keys
   - View key usage

### Feature Flags

1. **Enable/Disable Features**
   - Toggle features on/off
   - Test new features
   - Gradual rollout
   - Monitor usage

---

## Dispute Resolution

### Viewing Disputes

1. **Go to Disputes**
   - Click Admin → Disputes
   - See all disputes

2. **Filter Disputes**
   - By status (Open, In Review, Resolved, Closed)
   - By date range
   - By type

3. **Search Disputes**
   - Search by dispute ID
   - Search by user name
   - Search by contract ID

### Dispute Details

1. **View Dispute**
   - Click dispute
   - See full details
   - View both sides' claims
   - View evidence
   - View communication history

2. **Dispute Information**
   - Dispute ID
   - Parties involved
   - Contract details
   - Amount in dispute
   - Reason for dispute
   - Evidence submitted
   - Timeline

### Resolving Disputes

1. **Review Evidence**
   - Read client's claim
   - Read freelancer's response
   - Review submitted evidence
   - Check contract terms

2. **Make Decision**
   - Analyze both sides
   - Apply platform policies
   - Make fair decision
   - Document reasoning

3. **Implement Resolution**
   - Click "Resolve Dispute"
   - Select resolution type:
     - Full refund to client
     - Full payment to freelancer
     - Split payment
     - Other arrangement
   - Add notes
   - Confirm resolution

4. **Communicate Decision**
   - System sends notification to both parties
   - Include reasoning
   - Provide next steps
   - Offer appeal option

### Appeal Process

1. **Review Appeal**
   - If party appeals, review appeal
   - Consider new evidence
   - Reconsider decision

2. **Make Final Decision**
   - Confirm original decision or
   - Modify decision based on new evidence
   - Communicate final decision

---

## Security and Compliance

### Monitoring Security

1. **Review Security Logs**
   - Go to Admin → Security
   - View login attempts
   - View failed authentications
   - View suspicious activity

2. **Identify Threats**
   - Monitor for brute force attacks
   - Check for unusual patterns
   - Review IP addresses
   - Identify compromised accounts

3. **Take Action**
   - Suspend suspicious accounts
   - Reset compromised passwords
   - Block IP addresses
   - Investigate incidents

### Compliance

1. **Data Protection**
   - Ensure GDPR compliance
   - Manage user data requests
   - Handle data deletion requests
   - Maintain data privacy

2. **Payment Compliance**
   - Ensure PCI DSS compliance
   - Monitor payment security
   - Review Stripe compliance
   - Maintain audit logs

3. **Content Compliance**
   - Monitor for illegal content
   - Remove violations
   - Report to authorities if needed
   - Maintain compliance records

### Audit Logs

1. **View Audit Logs**
   - Go to Admin → Audit Logs
   - See all admin actions
   - Filter by action type
   - Filter by date range

2. **Audit Information**
   - Admin who took action
   - Action performed
   - Timestamp
   - Details of change
   - Reason for action

---

## Troubleshooting

### Common Issues

#### Payment Processing Issues

**Problem**: Payments failing

**Solution**:
1. Check Stripe connection
2. Verify API keys
3. Check payment method
4. Review error logs
5. Contact Stripe support if needed

#### User Account Issues

**Problem**: User cannot log in

**Solution**:
1. Check account status
2. Verify email is confirmed
3. Reset password
4. Check for suspicious activity
5. Contact user to verify

#### Project Issues

**Problem**: Project not appearing in search

**Solution**:
1. Check project status
2. Verify project details
3. Check for flags/violations
4. Reindex search
5. Contact support

#### Email Delivery Issues

**Problem**: Emails not being sent

**Solution**:
1. Check email configuration
2. Verify Resend API key
3. Check email templates
4. Review email logs
5. Test email delivery

### Performance Issues

1. **Slow Dashboard**
   - Check database performance
   - Optimize queries
   - Clear cache
   - Check server resources

2. **Slow Payments**
   - Check Stripe API
   - Verify network connection
   - Check database performance
   - Review transaction logs

### Data Issues

1. **Missing Data**
   - Check database backups
   - Verify data integrity
   - Review transaction logs
   - Restore from backup if needed

2. **Duplicate Data**
   - Identify duplicates
   - Merge records
   - Update references
   - Verify data consistency

---

## Best Practices

### User Management

1. **Regular Audits**: Review user accounts regularly
2. **Verify Users**: Ensure proper verification
3. **Monitor Activity**: Watch for suspicious behavior
4. **Respond Quickly**: Address issues promptly
5. **Document Actions**: Keep records of all actions

### Payment Management

1. **Monitor Transactions**: Review all transactions
2. **Verify Amounts**: Ensure correct commission calculation
3. **Track Disputes**: Monitor dispute resolution
4. **Maintain Records**: Keep audit trail
5. **Regular Reconciliation**: Reconcile payments regularly

### Security

1. **Strong Passwords**: Use strong admin passwords
2. **Two-Factor Auth**: Enable 2FA for admin accounts
3. **Regular Backups**: Backup data regularly
4. **Monitor Logs**: Review security logs
5. **Update Systems**: Keep systems updated

### Communication

1. **Clear Policies**: Communicate platform policies
2. **Timely Responses**: Respond to issues quickly
3. **Professional Tone**: Maintain professional communication
4. **Document Everything**: Keep records of communications
5. **Escalation Path**: Have clear escalation procedures

---

## Support and Resources

### Getting Help

- **Documentation**: Review this guide
- **API Documentation**: See API-DOCUMENTATION.md
- **Developer Guide**: See DEVELOPER_GUIDE.md
- **Support Team**: Contact support@talenthive.com

### Reporting Issues

- **Bug Reports**: Report bugs to development team
- **Security Issues**: Report to security@talenthive.com
- **User Issues**: Document and escalate

### Feedback

- Share suggestions for improvements
- Report feature requests
- Provide feedback on platform

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: Current
