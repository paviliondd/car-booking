import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsNumber()
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
  @Type(() => Number)
  dailyPrice: number;

  @IsNumber()
  @Type(() => Number)
  weekendPrice: number;

  @IsNumber()
  @Type(() => Number)
  holidayPrice: number;

  @IsNumber()
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
  @Type(() => Number)
  limitKmPerDay?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  overLimitFee?: number;

  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

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
