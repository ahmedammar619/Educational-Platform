import { IsString, IsNotEmpty, MinLength, IsDateString, IsOptional } from 'class-validator';

export class AddChildDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
