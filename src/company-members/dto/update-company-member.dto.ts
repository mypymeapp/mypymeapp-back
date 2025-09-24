import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateCompanyMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

