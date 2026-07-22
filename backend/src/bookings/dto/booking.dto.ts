import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
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
  @IsNotEmpty()
  pickupLocation: string;

  @IsString()
  @IsNotEmpty()
  dropoffLocation: string;

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
  insuranceType?: string;

  @IsNumber()
  @IsOptional()
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

export class TrackBookingDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
