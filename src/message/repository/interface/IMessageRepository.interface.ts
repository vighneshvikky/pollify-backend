import { Types } from 'mongoose';
import { MessageType } from 'src/message/enum/message.enum';
import {
  FileMetadata,
  PollMetadata,
} from 'src/message/interface/message.types';
import {
  MessageDocument,
  PollVote,
  PopulatedMessage,
} from 'src/message/schema/message.schema';

export const IMESSAGEREPOSITORY = Symbol('IMESSAGEREPOSITORY');

export interface IMessageRepository {
  saveMessage(
    chatId: string,
    senderId: string,
    content?: string,
    type?: MessageType,
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata,
    pollVotes?: PollVote[],
  ): Promise<PopulatedMessage>;

  getMessages(chatId: string): Promise<PopulatedMessage[]>;

  getMessageById(messageId: string): Promise<PopulatedMessage>;
  getUserById(userId: Types.ObjectId): Promise<PopulatedMessage>;

  vote(messageId: string, optionIndex: number): Promise<PopulatedMessage>;


    updatePollVote(
  messageId: string,
  pollMetadata: PollMetadata,
  pollVotes: PollVote[],
): Promise<PopulatedMessage> 
}
