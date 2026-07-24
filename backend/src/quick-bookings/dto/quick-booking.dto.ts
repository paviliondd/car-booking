import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { QuickBookingStatus } from '@prisma/client';
import { VIETNAM_PHONE_PATTERN } from '../../common/phone';

export class CreateQuickBookingDto {
  @IsUUID()
  vehicleId: string;

  @IsISO8601({ strict: true })
  startDate: string;

  @IsISO8601({ strict: true })
  endDate: string;

  @Matches(VIETNAM_PHONE_PATTERN, {
    message: 'Số điện thoại Việt Nam không hợp lệ',
  })
  phone: string;
}

export class ListQuickBookingsDto {
  @IsEnum(QuickBookingStatus)
  @IsOptional()
  status?: QuickBookingStatus;

  @IsString()
  @Length(1, 80)
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 30;
}

export class UpdateQuickBookingDto {
  @IsEnum(QuickBookingStatus)
  @IsOptional()
  status?: QuickBookingStatus;

  @IsString()
  @Length(0, 2000)
  @IsOptional()
  adminNotes?: string;
}
