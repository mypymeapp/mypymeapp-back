import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Priority, Department } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(Department)
  @IsOptional()
  department?: Department;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  clientCompany?: string;

  @IsString()
  @IsOptional()
  userEmail?: string; // Email del usuario autenticado (viene de NextAuth)
}
