import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: 'role_assigned' | 'role_removed' | 'permission_granted' | 'permission_revoked';
  performedBy: mongoose.Types.ObjectId;
  targetUser: mongoose.Types.ObjectId;
  resourceType: 'role' | 'permission';
  resourceId: mongoose.Types.ObjectId;
  resourceName: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: true,
    enum: ['role_assigned', 'role_removed', 'permission_granted', 'permission_revoked'],
    index: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    enum: ['role', 'permission'],
    required: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  resourceName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
    required: true,
    maxlength: 45, // IPv6 max length
  },
  userAgent: {
    type: String,
    required: true,
    maxlength: 500,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes for common queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
