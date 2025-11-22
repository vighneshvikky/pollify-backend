import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PopulatedMessage } from '../schema/message.schema';

import {
  IMessageRepository,
  IMESSAGEREPOSITORY,
} from '../repository/interface/IMessageRepository.interface';
import { IMessageService } from './interface/IMessage-interface';
import {
  FileMetadata,
  MessageResponse,
  PollMetadata,
} from '../interface/message.types';
import { CreatePollDto } from '../dtos/message.dto';
import { MessageType } from '../enum/message.enum';

function isPopulatedChat(
  chatId: Types.ObjectId | { _id: Types.ObjectId },
): chatId is { _id: Types.ObjectId } {
  return typeof chatId === 'object' && '_id' in chatId;
}

@Injectable()
export class MessageService implements IMessageService {
  constructor(
    @Inject(IMESSAGEREPOSITORY)
    private readonly _messageRepository: IMessageRepository,
  ) {}
  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: MessageType.TEXT,
    fileMetadata?: FileMetadata,
    pollMetadata?: PollMetadata,
  ): Promise<MessageResponse> {
    const saved = await this._messageRepository.saveMessage(
      chatId,
      senderId,
      content,
      type,
      fileMetadata,
      pollMetadata,
    );

    const populated = await this._messageRepository.getMessageById(
      saved._id.toString(),
    );
    return this.mapToResponse(populated);
  }

  async getMessages(chatId: string): Promise<MessageResponse[]> {
    const populated = await this._messageRepository.getMessages(chatId);
    return populated.map((msg) =>
      this.mapToResponse(msg as unknown as PopulatedMessage),
    );
  }

  async vote(
  messageId: string,
  optionIndex: number,
  userId: string,
): Promise<MessageResponse> {
  const message = await this._messageRepository.getMessageById(messageId);

  if (!message || message.type !== MessageType.POLL) {
    throw new NotFoundException('Invalid poll message');
  }

  const { pollMetadata, pollVotes } = message;

  if (!pollMetadata || !pollVotes) {
    throw new NotFoundException('Poll metadata missing');
  }

  const allowMultiple = pollMetadata.allowMultiple;

  let userVote = pollVotes.find(
    (v) => v.userId.toString() === userId,
  );

  // ======================================
  // CASE 1: MULTIPLE CHOICE POLL
  // ======================================
  if (allowMultiple) {
    if (!userVote) {
      pollVotes.push({
        userId: new Types.ObjectId(userId),
        optionIndices: [optionIndex],
        votedAt: new Date(),
      });
      pollMetadata.options[optionIndex].votes++;
    } else {
      const alreadySelected = userVote.optionIndices.includes(optionIndex);

      if (alreadySelected) {
        // REMOVE selection
        userVote.optionIndices = userVote.optionIndices.filter(
          (i) => i !== optionIndex,
        );
        pollMetadata.options[optionIndex].votes = Math.max(
          0,
          pollMetadata.options[optionIndex].votes - 1,
        );
      } else {
        // ADD selection
        userVote.optionIndices.push(optionIndex);
        pollMetadata.options[optionIndex].votes++;
      }

      userVote.votedAt = new Date();
    }
  }

  // ======================================
  // CASE 2: SINGLE CHOICE POLL
  // ======================================
  else {
    if (!userVote) {
      pollVotes.push({
        userId: new Types.ObjectId(userId),
        optionIndices: [optionIndex],
        votedAt: new Date(),
      });
      pollMetadata.options[optionIndex].votes++;
    } else {
      const prevIndex = userVote.optionIndices[0];

      if (prevIndex === optionIndex) {
        // Same option → ignore
        return this.mapToResponse(message);
      }

      // remove vote from previous
      pollMetadata.options[prevIndex].votes = Math.max(
        0,
        pollMetadata.options[prevIndex].votes - 1,
      );

      // add vote to new
      pollMetadata.options[optionIndex].votes++;

      userVote.optionIndices = [optionIndex];
      userVote.votedAt = new Date();
    }
  }

  // ======================================
  // SAVE CHANGES (Repository)
  // ======================================
  const updated = await this._messageRepository.updatePollVote(
    messageId,
    pollMetadata,
    pollVotes,
  );

  return this.mapToResponse(updated);
}

  async getMessageById(messageId: string): Promise<MessageResponse> {
    const message = await this._messageRepository.getMessageById(messageId);
    return this.mapToResponse(message);
  }

  async createPoll(data: CreatePollDto): Promise<MessageResponse> {
    const pollMetadata = {
      question: data.question,
      allowMultiple: data.allowMultiple,
      options: data.options.map((opt) => ({
        text: opt.text, // ✔ take only the string
        votes: 0, // ✔ initialize votes yourself
      })),
    };

    const saved = await this._messageRepository.saveMessage(
      data.chatId,
      data.senderId,
      undefined,
      MessageType.POLL,
      undefined,
      pollMetadata,
      [],
    );

    const populated = await this._messageRepository.getMessageById(
      saved._id.toString(),
    );
    return this.mapToResponse(populated);
  }

  async getUserById(userId: string) {
    const id = new Types.ObjectId(userId);

    const message = await this._messageRepository.getUserById(id);
    return this.mapToResponse(message);
  }

  private mapToResponse(message: PopulatedMessage): MessageResponse {
    const chatIdValue: string = isPopulatedChat(message.chatId)
      ? message.chatId._id.toString()
      : (message.chatId as Types.ObjectId).toString();

    return {
      _id: message._id.toString(),
      chatId: chatIdValue,
      sender: {
        _id: message.senderId._id.toString(),
        name: message.senderId.name,
        email: message.senderId.email,
        avatar: message.senderId.avatar,
      },
      content: message.content,
      type: message.type as MessageType,
      fileMetadata: message.fileMetadata
        ? {
            originalName: message.fileMetadata.originalName,
            fileName: message.fileMetadata.fileName,
            fileSize: message.fileMetadata.fileSize,
            mimeType: message.fileMetadata.mimeType,
            url: message.fileMetadata.url,
          }
        : undefined,
      pollMetadata: message.pollMetadata
        ? {
            question: message.pollMetadata.question,
            options: message.pollMetadata.options.map((opt) => ({
              text: opt.text,
              votes: opt.votes,
            })),
            allowMultiple: message.pollMetadata.allowMultiple,
          }
        : undefined,
      pollVotes: message.pollVotes
        ? message.pollVotes.map((vote) => ({
            userId: vote.userId.toString(),
            optionIndices: vote.optionIndices,
            votedAt: vote.votedAt,
          }))
        : undefined,
      isFormatted: message.isFormatted,
      timestamp: message.timestamp,
    };
  }
}
