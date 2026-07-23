import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';
import { OwnerApplicationStatus } from '@prisma/client';

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

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  credential: string;
}

export class UpgradeOwnerDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  idCardNo: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class VerifyOwnerDto {
  @IsBoolean()
  approve: boolean;
}

export class OwnerLeadDto {
  @IsString() @IsNotEmpty() name: string;
  @Matches(/^(0|\+84|84)\d{9}$/) phone: string;
  @IsString() @IsNotEmpty() carName: string;
  @IsString() @IsOptional() plateNumber?: string;
  @IsInt() @Min(1980) @Max(2100) @IsOptional() vehicleYear?: number;
  @IsString() @IsOptional() applicantNotes?: string;
}

export class RequestPhoneCodeDto {
  @Matches(/^(0|\+84|84)\d{9}$/)
  phone: string;
}

export class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
  @Matches(/^\d{6}$/)
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class ReviewOwnerApplicationDto {
  @IsEnum(OwnerApplicationStatus)
  status: OwnerApplicationStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class UpdateEmailDto {
  @IsEmail()
  email: string;
}
