import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiOperation({ summary: 'Create new company' })
  @ApiResponse({ status: 201, description: 'Empresa creada exitosamente' })
  @Post()
  create(@Body() data: CreateCompanyDto) {
    return this.companyService.createCompany(data);
  }

  @ApiOperation({ summary: 'Get all companies' })
  @Get()
  findAll() {
    return this.companyService.getCompanies();
  }

  @ApiOperation({ summary: 'Get a company passing id as a parameter' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getCompanyById(id);
  }

  @ApiOperation({ summary: 'Update company data' })
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(id, body);
  }

  @ApiOperation({ summary: 'Delete a company' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.deleteCompany(id);
  }

  @ApiOperation({ summary: 'Get company settings' })
  @Get(':id/settings')
  getSettings(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getSettings(id);
  }

  @ApiOperation({ summary: 'Update company settings' })
  @Patch(':id/settings')
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.companyService.updateSettings(id, body);
  }

  @ApiOperation({ summary: 'Add member to a company' })
  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() body: { userId: string; role: Role },
  ) {
    return this.companyService.addMember(companyId, body.userId, body.role);
  }

  @ApiOperation({ summary: 'Actualizar el rol de un miembro' })
  @Patch(':id/members/:userId')
  updateMemberRole(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { role: Role },
  ) {
    return this.companyService.updateMemberRole(companyId, userId, body.role);
  }

  @ApiOperation({ summary: 'Delete member of a company' })
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.companyService.removeMember(companyId, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company logo' })
  @ApiResponse({ status: 201, description: 'Logo subido correctamente' })
  @Post(':companyId/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 200_000 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.companyService.uploadLogo(companyId, file);
  }
}

