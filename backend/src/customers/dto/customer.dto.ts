import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { CustomerSegment } from '@prisma/client';

export class UpdateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  fullName?: string;

  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'Số điện thoại không đúng định dạng Việt Nam',
  })
  @IsOptional()
  phone?: string;

  @IsString()
  @Length(9, 12)
  @Matches(/^[0-9]+$/, { message: 'CCCD chỉ được chứa chữ số' })
  @IsOptional()
  idCardNo?: string;

  @IsEnum(CustomerSegment)
  @IsOptional()
  segment?: CustomerSegment;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;
}
