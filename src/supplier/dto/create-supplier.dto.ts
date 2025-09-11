import { IsString, IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '@prisma/client';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'Proveedor XYZ',
    description: 'Nombre del proveedor',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'proveedor@xyz.com',
    description: 'Correo del proveedor',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+598123456789',
    description: 'Teléfono del proveedor',
  })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Persona de contacto' })
  @IsString()
  contactName: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 123',
    description: 'Dirección del proveedor',
  })
  @IsString()
  address: string;

  @ApiProperty({ example: 'URUGUAY', enum: Country })
  country: Country;

  @ApiProperty({
    example: 'uuid-categoria',
    description: 'ID de categoría asociada',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'uuid-company',
    description: 'ID de la empresa asociada',
  })
  @IsUUID()
  companyId: string;
}

