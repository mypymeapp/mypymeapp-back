import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
    @ApiProperty({ example: 'uuid-del-archivo', required: false, description: 'ID del archivo de logo en FilesModule' })
    @IsOptional()
    @IsString()
    logoFileId?: string;
}
