import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
    @ApiProperty({ example: 10, required: false, description: 'Nivel mínimo de stock para alertas' })
    @IsOptional()
    @IsInt()
    @Min(0)
    bajoStock?: number;

    @ApiProperty({ example: 'FAC', required: false, description: 'Prefijo para numeración de facturas' })
    @IsOptional()
    @IsString()
    invoicePrefix?: string;

    @ApiProperty({ example: 'oscuro', required: false, description: 'Tema visual de la aplicación' })
    @IsOptional()
    @IsString()
    tema?: string;
}
