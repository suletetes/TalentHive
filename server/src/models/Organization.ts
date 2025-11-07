import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '@/types/organization';

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
}, { _id: false });

const organizationMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['admin', 'project_manager', 'member'],
    required: true,
  },
  permissions: [String],
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  industry: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [organizationMemberSchema],
  settings: {
    budgetApprovalThreshold: {
      type: Number,
      default: 1000,
      min: 0,
    },
    requiresApprovalWorkflow: {
      type: Boolean,
      default: false,
    },
    defaultProjectVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  billing: {
    paymentMethods: [String],
    billingAddress: addressSchema,
    taxId: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.userId': 1 });
organizationSchema.index({ isActive: 1 });

// Virtual for member count
organizationSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to add member
organizationSchema.methods.addMember = function(userId: string, role: string, permissions: string[] = []) {
  const existingMember = this.members.find((member: any) => member.userId.toString() === userId);
  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }
  
  this.members.push({
    userId,
    role,
    permissions,
    joinedAt: new Date(),
  });
};

// Method to remove member
organizationSchema.methods.removeMember = function(userId: string) {
  this.members = this.members.filter((member: any) => member.userId.toString() !== userId);
};

// Method to update member role
organizationSchema.methods.updateMemberRole = function(userId: string, role: string, permissions: string[] = []) {
  const member = this.members.find((member: any) => member.userId.toString() === userId);
  if (!member) {
    throw new Error('User is not a member of this organization');
  }
  
  member.role = role;
  member.permissions = permissions;
};

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);