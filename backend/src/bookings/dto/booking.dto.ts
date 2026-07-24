import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  IsIn,
  Min,
  Max,
  IsISO8601,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { BookingStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { VIETNAM_PHONE_PATTERN } from '../../common/phone';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  idCardNo: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  couponCode?: string;

  // Dành cho affiliate
  @IsString()
  @IsOptional()
  affiliateCode?: string;

  @IsString()
  @IsOptional()
  @IsIn(['NONE', 'BASIC', 'PREMIUM'])
  insuranceType?: string;

  @IsNumber()
  @IsOptional()
  @IsIn([30, 50])
  @Type(() => Number)
  depositPercent?: number;

  @IsString()
  @IsOptional()
  idCardFront?: string;

  @IsString()
  @IsOptional()
  idCardBack?: string;

  @IsString()
  @IsOptional()
  driverLicense?: string;
}

export class BookingQuoteDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsIn(['NONE', 'BASIC', 'PREMIUM'])
  insuranceType: string = 'NONE';

  @IsNumber()
  @Min(30)
  @Max(50)
  @IsIn([30, 50])
  @Type(() => Number)
  depositPercent: number = 30;

  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class CreateAdminBookingDto {
  @IsUUID()
  vehicleId: string;

  @IsISO8601({ strict: true })
  startDate: string;

  @IsISO8601({ strict: true })
  endDate: string;

  @IsString()
  @Length(2, 120)
  fullName: string;

  @Matches(VIETNAM_PHONE_PATTERN, {
    message: 'Số điện thoại Việt Nam không hợp lệ',
  })
  phone: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @Length(0, 2000)
  @IsOptional()
  notes?: string;

  @IsString()
  @IsIn(['NONE', 'BASIC', 'PREMIUM'])
  insuranceType: string = 'NONE';

  @IsNumber()
  @IsIn([30, 50])
  @Type(() => Number)
  depositPercent: number = 30;

  @IsUUID()
  @IsOptional()
  quickBookingRequestId?: string;
}

export class TrackBookingDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
