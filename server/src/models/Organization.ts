import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '@/types/organization';

const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
  },
  { _id: false }
);

const organizationMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      required: true,
    },
    permissions: [String],
    spendingLimit: { type: Number, min: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: String,
    website: String,
    industry: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [organizationMemberSchema],
    budgetSettings: {
      monthlyBudget: { type: Number, min: 0 },
      approvalThreshold: { type: Number, default: 1000, min: 0 },
      autoApproveBelow: { type: Number, min: 0 },
    },
    billingInfo: {
      companyName: String,
      taxId: String,
      address: addressSchema,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active',
      },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
    },
    settings: {
      requireApproval: { type: Boolean, default: true },
      allowMemberInvites: { type: Boolean, default: false },
      defaultSpendingLimit: { type: Number, default: 5000, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.userId': 1 });
organizationSchema.index({ isActive: 1 });

// Virtual for member count
organizationSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to add member
organizationSchema.methods.addMember = function (
  userId: string,
  role: string,
  permissions: string[] = [],
  spendingLimit?: number
) {
  const existingMember = this.members.find((member: any) => member.user.toString() === userId);
  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }

  this.members.push({
    user: userId,
    role,
    permissions,
    spendingLimit,
    joinedAt: new Date(),
  });
};

// Method to remove member
organizationSchema.methods.removeMember = function (userId: string) {
  this.members = this.members.filter((member: any) => member.user.toString() !== userId);
};

// Method to update member role
organizationSchema.methods.updateMemberRole = function (
  userId: string,
  role: string,
  permissions: string[] = [],
  spendingLimit?: number
) {
  const member = this.members.find((member: any) => member.user.toString() === userId);
  if (!member) {
    throw new Error('User is not a member of this organization');
  }

  member.role = role;
  member.permissions = permissions;
  if (spendingLimit !== undefined) {
    member.spendingLimit = spendingLimit;
  }
};

// Method to check if user has permission
organizationSchema.methods.hasPermission = function (userId: string, permission: string): boolean {
  const member = this.members.find((member: any) => member.user.toString() === userId);
  if (!member) return false;

  // Owner and admin have all permissions
  if (member.role === 'owner' || member.role === 'admin') return true;

  return member.permissions.includes(permission);
};

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);