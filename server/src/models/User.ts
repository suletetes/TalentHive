import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '@/types/user';

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
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'freelancerProfile.skills': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ 'rating.average': -1 });

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

export const User = mongoose.model<IUser>('User', userSchema);