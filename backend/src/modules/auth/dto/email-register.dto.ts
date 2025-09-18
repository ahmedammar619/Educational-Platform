// src/modules/auth/dto/email-register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';

export class EmailRegisterDto {
  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email: string;
}
