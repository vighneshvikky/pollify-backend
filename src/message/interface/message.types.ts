export interface FileMetadata {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface PollMetadata {
  question: string;
  options: { text: string; votes: number }[];
  allowMultiple?: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio';

export interface MessageResponse {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  type: MessageType;
  fileMetadata?: FileMetadata;
  pollMetadata?: PollMetadata;
  isFormatted: boolean;
  timestamp: Date;
}

export interface IMessageService {
  saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type?: MessageType,
    fileMetadata?: FileMetadata,
  ): Promise<MessageResponse>;

  getMessages(chatId: string): Promise<MessageResponse[]>;

  getMessageById(messageId: string): Promise<MessageResponse>;

  deleteMessage(messageId: string): Promise<void>;
}
