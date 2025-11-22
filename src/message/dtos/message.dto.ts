import {
  IsString,
  IsArray,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Question cannot exceed 200 characters' })
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  options: { text: string; votes: number }[];

  @IsBoolean()
  allowMultiple: boolean;
}




export class VotePollDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsNumber()
  @Min(0)
  optionIndex: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}