import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageType } from '../enum/message.enum';
import { PollMetadata, PollMetadataResponse } from '../interface/message.types';

export interface PollVote {
  userId: Types.ObjectId;
  optionIndices: number[];
  votedAt: Date;
}

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: false })
  content: string;

  @Prop({
    default: MessageType.TEXT,
    enum: MessageType,
  })
  type: MessageType;

  @Prop({ type: Object })
  fileMetadata?: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  };

  @Prop({
    type: {
      question: String,
      options: [String],
      allowMultiple: Boolean,
    },
    required: false,
  })
  pollMetadata?: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  };

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        optionIndices: [Number],
        votedAt: Date,
      },
    ],
    default: [],
  })
  pollVotes?: PollVote[];

  @Prop({ type: Boolean, default: false })
  isFormatted: boolean;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export type MessageDocument = Message &
  Document & {
    _id: Types.ObjectId;
  };

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface PopulatedMessage {
  _id: Types.ObjectId;
  chatId: Types.ObjectId | { _id: Types.ObjectId };
  senderId: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  type: MessageType | string;
  fileMetadata?: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  };
  poll?: PollMetadataResponse;
    pollMetadata?: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  };
    pollVotes?: Array<{
    userId: Types.ObjectId;
    optionIndices: number[];
    votedAt: Date;
  }>;
  isFormatted: boolean;
  timestamp: Date;
}
