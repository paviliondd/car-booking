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
} from 'class-validator';
import { BookingStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';

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

export class TrackBookingDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
