import { CreatePollDto } from 'src/message/dtos/message.dto';
import { MessageType } from 'src/message/enum/message.enum';
import {
  FileMetadata,
  MessageResponse,
  PollMetadata,
} from 'src/message/interface/message.types';

export const IMESSAGESERVICE = Symbol('IMESSAGESERVICE');

export interface IMessageService {
  saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type?: MessageType,
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata,
  ): Promise<MessageResponse>;

  getMessages(chatId: string): Promise<MessageResponse[]>;

  createPoll(data: CreatePollDto): Promise<MessageResponse>;

  getMessageById(messageId: string): Promise<MessageResponse>;
  getUserById(userId: string): Promise<MessageResponse>;

  vote(
    messageId: string,
    optionIndex: number,
    userId: string,
  ): Promise<MessageResponse>;
}
