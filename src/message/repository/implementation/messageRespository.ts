import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  PopulatedMessage,
} from 'src/message/schema/message.schema';
import { IMessageRepository } from '../interface/IMessageRepository.interface';
import {
  FileMetadata,
  PollMetadata,
} from 'src/message/interface/message.types';
import { MessageType } from 'src/message/enum/message.enum';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: string = 'text',
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata,
  ): Promise<PopulatedMessage> {
    if (type === MessageType.IMAGE && fileMetadata?.fileName) {
      fileMetadata.url = `/uploads/${encodeURIComponent(fileMetadata.fileName)}`;
    }

    const messageData = new this.messageModel({
      chatId: new Types.ObjectId(chatId),
      senderId: new Types.ObjectId(senderId),
      content,
      type,
      fileMetadata,
      isFormatted: type === MessageType.TEXT && this.hasFormatting(content),
    });

    if (type === MessageType.POLL) {
      messageData.pollMetadata = pollMetadata;
      messageData.content = '';
    }

    const message = new this.messageModel(messageData);

    const saved = await message.save();

    const populated = await this.messageModel
      .findById(saved._id as Types.ObjectId)
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .lean()
      .exec();

    if (!populated) {
      throw new NotFoundException(`Message not found after saving`);
    }

    return populated as unknown as PopulatedMessage;
  }

  async getMessages(chatId: string): Promise<PopulatedMessage[]> {
    const objectId = new Types.ObjectId(chatId);
    const messages = await this.messageModel
      .find({ chatId: objectId })
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return messages as unknown as PopulatedMessage[];
  }

  async vote(
    messageId: string,
    optionIndex: number,
  ): Promise<PopulatedMessage> {
    const updated = await this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $inc: { [`pollMetadata.options.${optionIndex}.votes`]: 1 } },
        { new: true },
      )
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Poll message not found');

    return updated as unknown as PopulatedMessage;
  }

  async getMessageById(messageId: string): Promise<PopulatedMessage> {
    const message = await this.messageModel
      .findById(messageId)
      .populate('senderId', 'name email avatar')
      .populate('chatId', 'name isGroup')
      .lean()
      .exec();

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return message as unknown as PopulatedMessage;
  }

  async getUserById(userId: Types.ObjectId) {
    const message = await this.messageModel
      .find({ senderId: userId })
      .populate('senderId', '_id name email avatar')
      .exec();

    return message as unknown as PopulatedMessage;
  }

  private hasFormatting(content: string): boolean {
    const formatPatterns = /(\*\*|__|\*|_|~~|`)/;
    return formatPatterns.test(content);
  }
}
