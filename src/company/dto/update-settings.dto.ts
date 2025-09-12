import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({
    example: 10,
    required: false,
    description: 'Minimun stock level for alerts',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  bajoStock?: number;

  @ApiProperty({
    example: 'FAC',
    required: false,
    description: 'Invoice numeration prefix',
  })
  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @ApiProperty({
    example: 'oscuro',
    required: false,
    description: 'App visual theme',
  })
  @IsOptional()
  @IsString()
  tema?: string;
}

