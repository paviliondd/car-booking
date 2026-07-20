import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200_000)
  renterSignature: string;
}
