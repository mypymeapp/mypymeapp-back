import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Electrodomésticos' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'd3f5e0a0-7c3a-4b6a-9d87-1a2f3c4e5b6f' })
    @IsUUID()
    companyId: string;
}
