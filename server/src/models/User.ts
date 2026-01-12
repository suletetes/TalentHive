import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserModel } from '@/types/user';

const timeSlotSchema = new Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const weeklyScheduleSchema = new Schema({
  monday: [timeSlotSchema],
  tuesday: [timeSlotSchema],
  wednesday: [timeSlotSchema],
  thursday: [timeSlotSchema],
  friday: [timeSlotSchema],
  saturday: [timeSlotSchema],
  sunday: [timeSlotSchema],
}, { _id: false });

const availabilitySlotSchema = new Schema({
  date: { type: Date, required: true },
  isAvailable: { type: Boolean, required: true },
  note: String,
}, { _id: false });

const servicePackageSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  deliveryTime: { type: Number, required: true, min: 1 },
  revisions: { type: Number, required: true, min: 0 },
  features: [String],
  isActive: { type: Boolean, default: true },
});

const teamMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  skills: [String],
  hourlyRate: Number,
}, { _id: false });

const certificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  dateEarned: { type: Date, required: true },
  expiryDate: Date,
  verificationUrl: String,
}, { _id: false });

const portfolioItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],
  projectUrl: String,
  technologies: [String],
  completedAt: { type: Date, required: true },
});

const workExperienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  current: { type: Boolean, default: false },
  description: { type: String, maxlength: 2000 },
}, { _id: true });

const educationSchema = new Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  fieldOfStudy: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  description: { type: String, maxlength: 1000 },
}, { _id: true });

const languageSchema = new Schema({
  language: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['basic', 'conversational', 'fluent', 'native'],
    required: true,
  },
}, { _id: false });

const projectTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skills: [String],
  budget: {
    type: { type: String, enum: ['fixed', 'hourly'], required: true },
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  timeline: {
    duration: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['days', 'weeks', 'months'], required: true },
  },
  requirements: [String],
  attachments: [String],
});

const adminPermissionSchema = new Schema({
  resource: { type: String, required: true },
  actions: [String],
}, { _id: false });

// New RBAC permissions structure
const userPermissionsSchema = new Schema({
  roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  directPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  deniedPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
}, { _id: false });

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'freelancer', 'client'],
    required: true,
  },
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: String,
    bio: { type: String, maxlength: 1000 },
    location: String,
    timezone: String,
  },
  freelancerProfile: {
    title: String,
    hourlyRate: { type: Number, min: 0 },
    skillRates: [{
      skill: { type: String, required: true },
      rate: { type: Number, required: true, min: 0 },
    }],
    skills: [String],
    experience: String,
    portfolio: [portfolioItemSchema],
    workExperience: [workExperienceSchema],
    education: [educationSchema],
    languages: [languageSchema],
    availability: {
      status: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available',
      },
      schedule: weeklyScheduleSchema,
      calendar: [availabilitySlotSchema],
    },
    servicePackages: [servicePackageSchema],
    teamMembers: [teamMemberSchema],
    certifications: [certificationSchema],
    timeTracking: {
      isEnabled: { type: Boolean, default: false },
      screenshotFrequency: { type: Number, min: 1, max: 60 },
      activityMonitoring: { type: Boolean, default: false },
    },
  },
  clientProfile: {
    companyName: String,
    industry: String,
    projectsPosted: { type: Number, default: 0, min: 0 },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    teamRole: {
      type: String,
      enum: ['owner', 'admin', 'member'],
    },
    budgetLimits: {
      daily: { type: Number, min: 0 },
      monthly: { type: Number, min: 0 },
      requiresApproval: { type: Boolean, default: false },
    },
    preferredVendors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    projectTemplates: [projectTemplateSchema],
  },
  adminProfile: {
    permissions: [adminPermissionSchema],
    lastLoginAt: Date,
    accessLevel: {
      type: String,
      enum: ['super_admin', 'moderator', 'support'],
      default: 'support',
    },
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active',
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // Featured freelancer fields
  isFeatured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },
  featuredSince: Date,
  // Additional roles
  roles: [{
    type: String,
    enum: ['admin', 'freelancer', 'client', 'work_verifier', 'moderator', 'support'],
  }],
  primaryRole: {
    type: String,
    enum: ['admin', 'freelancer', 'client'],
  },
  // Stripe integration
  stripeCustomerId: String,
  stripeConnectedAccountId: String,
  // Theme preference
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  // Profile slug for custom URLs
  profileSlug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: 50,
  },
  slugHistory: [{
    slug: { type: String, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
  }],
  // Onboarding tracking
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  onboardingSkippedAt: Date,
  // Profile analytics
  profileViews: { type: Number, default: 0, min: 0 },
  profileViewers: [{
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, required: true, default: Date.now },
  }],
  // RBAC permissions structure
  permissions: {
    type: userPermissionsSchema,
    default: () => ({ roles: [], directPermissions: [], deniedPermissions: [] }),
  },
  lastPermissionUpdate: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
// Note: email already has unique index from schema definition
userSchema.index({ role: 1 });
userSchema.index({ 'freelancerProfile.skills': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ isFeatured: 1, featuredOrder: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ profileSlug: 1 });
userSchema.index({ onboardingCompleted: 1 });
// RBAC indexes
userSchema.index({ 'permissions.roles': 1 });
userSchema.index({ 'permissions.directPermissions': 1 });
userSchema.index({ lastPermissionUpdate: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update rating
userSchema.methods.updateRating = function(newRating: number) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser>('User', userSchema) as mongoose.Model<IUser> & IUserModel;