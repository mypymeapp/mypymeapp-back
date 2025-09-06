import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Tech Solutions S.A.', description: 'Nombre comercial de la empresa' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'user@example.com', description: 'Correo electrónico de contacto' })
    @IsEmail()
    mail: string;

    @ApiProperty({ example: 'hashed_password_123', description: 'Hash de la contraseña del administrador' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ example: 'Uruguay', description: 'País de la empresa' })
    @IsString()
    @IsNotEmpty()
    pais: string;

    @ApiProperty({ example: 'Tech Solutions Sociedad Anónima', description: 'Razón social' })
    @IsString()
    @IsNotEmpty()
    razonSocial: string;

    @ApiProperty({ example: '123456789012', description: 'RUT o CUIT de la empresa' })
    @IsString()
    @IsNotEmpty()
    rut_Cuit: string;

    @ApiProperty({ example: 'Tecnología', description: 'Rubro principal de la empresa' })
    @IsString()
    @IsNotEmpty()
    rubroPrincipal: string;
}