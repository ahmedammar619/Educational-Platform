import { IsEmail, IsNotEmpty, IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class ParentSignupDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsPhoneNumber()
  phone: string;
}
