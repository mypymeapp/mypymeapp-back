import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsOptional()
  isFromUser?: boolean;

  @IsString()
  @IsOptional()
  userEmail?: string; // Email del usuario autenticado (viene de NextAuth)
}
