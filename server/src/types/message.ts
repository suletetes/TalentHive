import { Document, ObjectId } from 'mongoose';

export interface IMessage extends Document {
  conversation: ObjectId;
  sender: ObjectId;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments: IAttachment[];
  readBy: ObjectId[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  participants: ObjectId[];
  project?: ObjectId;
  contract?: ObjectId;
  lastMessage?: ObjectId;
  unreadCount: Map<string, number>;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  _id: ObjectId;
  type: 'file' | 'image' | 'document';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}
