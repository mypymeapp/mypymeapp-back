import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Perez', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Customer email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+59891234567',
    description: 'Customer phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '2025-09-12T12:00:00Z',
    description: 'Customer member since date',
    required: false,
  })
  @IsOptional()
  memberSince?: Date;

  @ApiProperty({
    example: 'Important client',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'uuid-of-company',
    description: 'ID of the company this customer belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}

