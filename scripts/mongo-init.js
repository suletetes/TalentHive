// MongoDB initialization script
db = db.getSiblingDB('talenthive');

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('projects');
db.createCollection('proposals');
db.createCollection('contracts');
db.createCollection('messages');
db.createCollection('reviews');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'freelancerProfile.skills': 1 });
db.users.createIndex({ isActive: 1 });

db.projects.createIndex({ client: 1 });
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ skills: 1 });
db.projects.createIndex({ createdAt: -1 });

db.proposals.createIndex({ project: 1 });
db.proposals.createIndex({ freelancer: 1 });
db.proposals.createIndex({ status: 1 });

db.contracts.createIndex({ client: 1 });
db.contracts.createIndex({ freelancer: 1 });
db.contracts.createIndex({ status: 1 });

db.messages.createIndex({ conversation: 1 });
db.messages.createIndex({ sender: 1 });
db.messages.createIndex({ createdAt: -1 });

db.reviews.createIndex({ reviewer: 1 });
db.reviews.createIndex({ reviewee: 1 });

db.notifications.createIndex({ user: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });

print('Database initialized successfully!');