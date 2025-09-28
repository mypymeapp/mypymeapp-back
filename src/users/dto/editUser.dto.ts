import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditUserDto {
  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Estado activo del usuario' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Si el usuario es administrador', required: false })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiProperty({ 
    description: 'Rol de administrador', 
    enum: ['SUPER_ADMIN', 'SUPPORT', 'MANAGER'],
    required: false 
  })
  @IsEnum(['SUPER_ADMIN', 'SUPPORT', 'MANAGER'])
  @IsOptional()
  adminRole?: 'SUPER_ADMIN' | 'SUPPORT' | 'MANAGER';

  @ApiProperty({ 
    description: 'Departamento del administrador', 
    enum: ['TECNICO', 'FINANCIERO', 'ADMINISTRATIVO', 'VENTAS'],
    required: false 
  })
  @IsEnum(['TECNICO', 'FINANCIERO', 'ADMINISTRATIVO', 'VENTAS'])
  @IsOptional()
  adminDepartment?: 'TECNICO' | 'FINANCIERO' | 'ADMINISTRATIVO' | 'VENTAS';
}
