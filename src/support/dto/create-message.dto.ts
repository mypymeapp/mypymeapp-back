import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsOptional()
  isFromUser?: boolean;
}
