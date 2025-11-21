import { FileMetadata, MessageResponse, MessageType, PollMetadata } from "src/message/interface/message.types";

export const IMESSAGESERVICE = Symbol('IMESSAGESERVICE');

export interface IMessageService {
  saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type?: MessageType,
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata
  ): Promise<MessageResponse>;

  getMessages(chatId: string): Promise<MessageResponse[]>;

  getMessageById(messageId: string): Promise<MessageResponse>;
    getUserById(userId: string): Promise<MessageResponse>;

    vote(
        messageId: string,
        optionIndex: number,
      ): Promise<MessageResponse> 

}