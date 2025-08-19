import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AddChildDto {
  @IsInt()
  @IsNotEmpty()
  childId: number;

  @IsInt()
  @Min(1)
  childAge: number;
}
