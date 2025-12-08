import mongoose from 'mongoose';
import User from '../models/User';
import SupportTicket from '../models/SupportTicket';
import OnboardingAnalytics from '../models/OnboardingAnalytics';
import { generateSlug } from '../utils/slugUtils';

/**
 * Add profile slugs to existing users
 */
export async function addProfileSlugs() {
  console.log('Adding profile slugs to users...');
  
  const users = await User.find({ profileSlug: { $exists: false } });
  let updated = 0;

  for (const user of users) {
    const baseName = `${user.profile.firstName}-${user.profile.lastName}`;
    let slug = generateSlug(baseName);
    
    // Check for uniqueness
    let counter = 1;
    while (await User.findOne({ profileSlug: slug })) {
      slug = `${generateSlug(baseName)}-${counter}`;
      counter++;
    }

    user.profileSlug = slug;
    await user.save();
    updated++;
  }

  console.log(`✓ Added profile slugs to ${updated} users`);
}

/**
 * Add onboarding status to existing users
 */
export async function addOnboardingStatus() {
  console.log('Adding onboarding status to users...');
  
  const users = await User.find({ onboardingCompleted: { $exists: false } });
  let updated = 0;

  for (const user of users) {
    // 80% completed onboarding, 20% haven't
    const completed = Math.random() > 0.2;
    
    user.onboardingCompleted = completed;
    user.onboardingStep = completed ? 3 : Math.floor(Math.random() * 3);
    
    if (!completed && Math.random() > 0.5) {
      // 50% of incomplete users skipped it
      user.onboardingSkippedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }

    await user.save();
    updated++;
  }

  console.log(`✓ Added onboarding status to ${updated} users`);
}

/**
 * Create onboarding analytics for users
 */
export async function createOnboardingAnalytics() {
  console.log('Creating onboarding analytics...');
  
  const users = await User.find({ onboardingCompleted: true });
  let created = 0;

  for (const user of users) {
    const existing = await OnboardingAnalytics.findOne({ userId: user._id });
    if (existing) continue;

    const startedAt = new Date(user.createdAt);
    const completedAt = new Date(startedAt.getTime() + Math.random() * 3600000); // 0-1 hour
    const totalSteps = 3;

    const analytics = new OnboardingAnalytics({
      userId: user._id,
      role: user.role,
      startedAt,
      completedAt,
      currentStep: totalSteps,
      totalSteps,
      stepsCompleted: [
        {
          stepNumber: 0,
          stepName: 'Profile Setup',
          completedAt: new Date(startedAt.getTime() + Math.random() * 600000),
          timeSpent: Math.floor(Math.random() * 300),
        },
        {
          stepNumber: 1,
          stepName: user.role === 'freelancer' ? 'Skills' : 'Company Info',
          completedAt: new Date(startedAt.getTime() + Math.random() * 1200000),
          timeSpent: Math.floor(Math.random() * 400),
        },
        {
          stepNumber: 2,
          stepName: user.role === 'freelancer' ? 'Bio' : 'About',
          completedAt,
          timeSpent: Math.floor(Math.random() * 300),
        },
      ],
      completionRate: 100,
    });

    await analytics.save();
    created++;
  }

  console.log(`✓ Created onboarding analytics for ${created} users`);
}

/**
 * Create sample support tickets
 */
export async function createSupportTickets() {
  console.log('Creating support tickets...');
  
  const users = await User.find({ role: { $in: ['freelancer', 'client'] } }).limit(20);
  const admins = await User.find({ role: 'admin' });
  
  if (admins.length === 0) {
    console.log('⚠ No admins found, skipping support tickets');
    return;
  }

  const subjects = [
    'Unable to submit proposal',
    'Payment not received',
    'Profile verification issue',
    'Project posting error',
    'Account access problem',
    'Notification settings not working',
    'Contract dispute',
    'Milestone approval delay',
    'Message delivery issue',
    'Search functionality bug',
  ];

  const categories = ['technical', 'billing', 'account', 'project', 'other'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];

  let created = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const subject = subjects[i % subjects.length];
    const category = categories[i % categories.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    const admin = admins[i % admins.length];

    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    const ticket = new SupportTicket({
      userId: user._id,
      subject,
      status,
      priority,
      category,
      messages: [
        {
          senderId: user._id,
          message: `I'm experiencing an issue with ${subject.toLowerCase()}. Could you please help me resolve this?`,
          isAdminResponse: false,
          isRead: true,
          createdAt,
        },
      ],
      createdAt,
      updatedAt: createdAt,
      lastResponseAt: createdAt,
    });

    // Add admin response for some tickets
    if (status !== 'open' && Math.random() > 0.3) {
      const responseTime = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      ticket.messages.push({
        senderId: admin._id,
        message: `Thank you for contacting support. I've reviewed your issue and ${status === 'resolved' ? 'resolved it' : 'am working on it'}. Please let me know if you need further assistance.`,
        isAdminResponse: true,
        isRead: Math.random() > 0.5,
        createdAt: responseTime,
      });
      ticket.assignedAdminId = admin._id;
      ticket.lastResponseAt = responseTime;
      ticket.updatedAt = responseTime;

      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = responseTime;
        if (status === 'closed') {
          ticket.closedAt = new Date(responseTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }
      }
    }

    // Add tags
    const tags = ['bug', 'feature-request', 'urgent', 'follow-up', 'resolved'];
    ticket.tags = [tags[i % tags.length]];

    await ticket.save();
    created++;
  }

  console.log(`✓ Created ${created} support tickets`);
}

/**
 * Add profile views to users
 */
export async function addProfileViews() {
  console.log('Adding profile views to users...');
  
  const freelancers = await User.find({ role: 'freelancer' });
  const clients = await User.find({ role: 'client' });
  let updated = 0;

  for (const freelancer of freelancers) {
    const viewCount = Math.floor(Math.random() * 100);
    freelancer.profileViews = viewCount;

    // Add some profile viewers
    const viewerCount = Math.min(viewCount, 10);
    for (let i = 0; i < viewerCount; i++) {
      const viewer = clients[Math.floor(Math.random() * clients.length)];
      if (viewer) {
        freelancer.profileViewers.push({
          viewerId: viewer._id,
          viewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }

    await freelancer.save();
    updated++;
  }

  console.log(`✓ Added profile views to ${updated} freelancers`);
}

/**
 * Main function to run all seed enhancements
 */
export async function seedNewFeatures() {
  try {
    console.log('\n🌱 Starting new features seed data...\n');

    await addProfileSlugs();
    await addOnboardingStatus();
    await createOnboardingAnalytics();
    await createSupportTickets();
    await addProfileViews();

    console.log('\n✅ New features seed data completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding new features:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenthive';
  
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('📦 Connected to MongoDB');
      await seedNewFeatures();
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}
