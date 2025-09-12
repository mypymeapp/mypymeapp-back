import { IsString, IsNotEmpty, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Tech Solutions S.A.',
    description: 'Company name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Contact email of the company',
  })
  @IsEmail()
  mail: string;

  @ApiProperty({
    example: 'hashed_password_123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Uruguay', description: 'Country' })
  @IsString()
  @IsNotEmpty()
  pais: string;

  @ApiProperty({
    example: 'Tech Solutions Sociedad Anónima',
    description: 'Business name',
  })
  @IsString()
  @IsNotEmpty()
  razonSocial: string;

  @ApiProperty({
    example: '123456789012',
    description: 'Tax identification number (RUT/CUIT)',
  })
  @IsString()
  @IsNotEmpty()
  rut_Cuit: string;

  @ApiProperty({
    example: 'Tecnología',
    description: 'Main business activity',
  })
  @IsString()
  @IsNotEmpty()
  rubroPrincipal: string;

  @ApiProperty({
    example: 'uuid-del-usuario',
    description: 'User ID to link with the company',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

