import { IsString, IsNotEmpty, Length, IsDateString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
