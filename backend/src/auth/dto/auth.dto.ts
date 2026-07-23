import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

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
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() carName: string;
}
