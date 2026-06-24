import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  // Dành cho customer profile đi kèm
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idCardNo?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
