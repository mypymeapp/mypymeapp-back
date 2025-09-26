import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Priority, Department, Status } from '@prisma/client';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(Department)
  @IsOptional()
  department?: Department;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsString()
  @IsOptional()
  assignedAdminId?: string;
}
