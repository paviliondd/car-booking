import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateAccountProfileDto {
  @IsString()
  @Length(2, 80)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @Length(5, 255)
  @IsOptional()
  address?: string;

  @Matches(/^\d{9,12}$/, {
    message: 'Số CCCD/CMND phải gồm 9 đến 12 chữ số',
  })
  @IsOptional()
  idCardNo?: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(1, 72)
  currentPassword: string;

  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải có ít nhất một chữ cái và một chữ số',
  })
  newPassword: string;
}
