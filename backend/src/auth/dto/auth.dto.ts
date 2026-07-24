import { OwnerApplicationStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VIETNAM_PHONE_PATTERN } from '../../common/phone';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class RequestPhoneCodeDto {
  @Matches(VIETNAM_PHONE_PATTERN, {
    message: 'Số điện thoại Việt Nam không hợp lệ',
  })
  phone: string;
}

export class RegisterDto extends RequestPhoneCodeDto {
  @Matches(/^\d{6}$/)
  code: string;

  @IsString()
  @Length(2, 80)
  name: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_PATTERN, {
    message: 'Mật khẩu phải có ít nhất một chữ cái và một chữ số',
  })
  password: string;
}

export class LoginDto extends RequestPhoneCodeDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ResetPasswordDto extends RequestPhoneCodeDto {
  @Matches(/^\d{6}$/)
  code: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_PATTERN, {
    message: 'Mật khẩu phải có ít nhất một chữ cái và một chữ số',
  })
  password: string;
}

export class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
  @Matches(/^\d{6}$/)
  code: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  credential: string;
}

export class FacebookLoginDto {
  @IsString()
  @Length(20, 4096)
  accessToken: string;
}

export class OwnerApplicationDto {
  @IsString()
  @Length(2, 100)
  carName: string;

  @IsString()
  @IsOptional()
  @Length(4, 20)
  plateNumber?: string;

  @IsInt()
  @Min(1980)
  @Max(2100)
  @IsOptional()
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  applicantNotes?: string;
}

export class VerifyOwnerDto {
  @IsBoolean()
  approve: boolean;
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
