import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  message: string;
}

export class ReplyTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  reply: string;
}
