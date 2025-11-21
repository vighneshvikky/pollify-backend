import { Types } from 'mongoose';
import { FileMetadata, MessageType, PollMetadata } from 'src/message/interface/message.types';
import {
  MessageDocument,
  PopulatedMessage,
} from 'src/message/schema/message.schema';

export const IMESSAGEREPOSITORY = Symbol('IMESSAGEREPOSITORY');

export interface IMessageRepository {
  saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type?: MessageType,
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata,
  ): Promise<PopulatedMessage>;

  getMessages(chatId: string): Promise<PopulatedMessage[]>;

  getMessageById(messageId: string): Promise<PopulatedMessage>;
  getUserById(userId: Types.ObjectId): Promise<PopulatedMessage>;

  vote(messageId: string, optionIndex: number): Promise<PopulatedMessage>;
}
