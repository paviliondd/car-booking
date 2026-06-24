import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

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
}

export class TrackBookingDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}
