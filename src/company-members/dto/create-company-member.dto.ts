import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateCompanyMemberDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

