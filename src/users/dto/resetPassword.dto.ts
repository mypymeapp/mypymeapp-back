import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminResetPasswordDto {
  @ApiProperty({ 
    description: 'Nueva contraseña temporal', 
    default: 'temp123456',
    required: false 
  })
  @IsString()
  @IsOptional()
  temporaryPassword?: string;
}
