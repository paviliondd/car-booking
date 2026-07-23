import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsInt()
  @Min(2)
  @Max(50)
  @Type(() => Number)
  seats: number;

  @IsString()
  @IsNotEmpty()
  transmission: string;

  @IsString()
  @IsNotEmpty()
  fuel: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dailyPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weekendPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  holidayPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  penaltyRate: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  limitKmPerDay?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  overLimitFee?: number;

  @IsString()
  @IsOptional()
  terms?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  plateNumber?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @IsInt()
  @Min(2)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  seats?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  transmission?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fuel?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  dailyPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  weekendPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  holidayPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  penaltyRate?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  limitKmPerDay?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  overLimitFee?: number;

  @IsString()
  @IsOptional()
  terms?: string;
}

export class SearchVehicleDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seats?: number;
}

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus)
  status: VehicleStatus;
}
