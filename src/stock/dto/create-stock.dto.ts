import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockDto {
    @ApiProperty({ example: 'uuid-producto', description: 'ID del producto' })
    @IsUUID()
    productId: string;

    @ApiProperty({ example: 'uuid-company', description: 'ID de la compañía' })
    @IsUUID()
    companyId: string;

    @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
    @IsEnum(StockMovementType)
    type: StockMovementType;

    @ApiProperty({ example: 10, description: 'Cantidad de unidades a mover' })
    @IsInt()
    @Min(1)
    qty: number;

    @ApiProperty({ example: 'Compra de proveedor', required: false })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiProperty({ example: 'invoice', required: false })
    @IsOptional()
    @IsString()
    refType?: string;

    @ApiProperty({ example: 'uuid-invoice', required: false })
    @IsOptional()
    @IsString()
    refId?: string;
}

