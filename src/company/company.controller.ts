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
import { SupplierService } from 'src/supplier/supplier.service';
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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Companies')
@Controller('companies')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly supplierService: SupplierService,
  ) {}

  @ApiOperation({ summary: 'Create new company' })
  @ApiResponse({ status: 201, description: 'Company data' })
  @Post()
  create(@Body() data: CreateCompanyDto) {
    return this.companyService.createCompany(data);
  }

  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Company list' })
  @Get()
  // @Roles(Role.SUPERADMIN)
  findAll() {
    return this.companyService.getCompanies();
  }

  @ApiOperation({ summary: 'Get a company passing id as a parameter' })
  @ApiResponse({ status: 200, description: 'Specific company data' })
  @Get(':id')
  // @Roles(Role.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getCompanyById(id);
  }

  @ApiOperation({ summary: 'Get suppliers of a company' })
  @ApiResponse({ status: 200, description: 'List of suppliers for a company' })
  @Get(':id/suppliers')
  async getSuppliersByCompany(@Param('id', ParseUUIDPipe) companyId: string) {
    return this.supplierService.getSuppliersByCompany(companyId);
  }

  @ApiOperation({ summary: 'Update company data' })
  @ApiResponse({ status: 200, description: 'Edited company data' })
  @Put(':id')
  // @Roles(Role.ADMIN, Role.OWNER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(id, body);
  }

  @ApiOperation({ summary: 'Delete a company' })
  @ApiResponse({ status: 200, description: 'Deleted company data' })
  @Delete(':id')
  // @Roles(Role.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.deleteCompany(id);
  }

  @ApiOperation({ summary: 'Get company settings' })
  @Get(':id/settings')
  // @Roles(Role.ADMIN, Role.OWNER)
  getSettings(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getSettings(id);
  }

  @ApiOperation({ summary: 'Update company settings' })
  @ApiResponse({ status: 200, description: 'Edited company data' })
  @Patch(':id/settings')
  // @Roles(Role.ADMIN, Role.OWNER)
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.companyService.updateSettings(id, body);
  }

  @ApiOperation({ summary: 'Add member to a company' })
  @Post(':id/members')
  // @Roles(Role.ADMIN, Role.OWNER)
  addMember(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() body: { userId: string; role: Role },
  ) {
    return this.companyService.addMember(companyId, body.userId, body.role);
  }

  @ApiOperation({ summary: 'Actualizar el rol de un miembro' })
  @ApiResponse({ status: 200, description: 'Edited company data' })
  @Patch(':id/members/:userId')
  // @Roles(Role.ADMIN, Role.OWNER)
  updateMemberRole(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { role: Role },
  ) {
    return this.companyService.updateMemberRole(companyId, userId, body.role);
  }

  @ApiOperation({ summary: 'Delete member of a company' })
  @Delete(':id/members/:userId')
  // @Roles(Role.ADMIN, Role.OWNER)
  removeMember(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.companyService.removeMember(companyId, userId);
  }

  @ApiOperation({ summary: 'Get company inventory (productos con stock)' })
  @Get(':id/inventory')
  async getInventory(@Param('id', ParseUUIDPipe) companyId: string) {
    return this.companyService.getInventory(companyId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company logo' })
  @ApiResponse({ status: 201, description: 'Logo successfully uploaded' })
  @Post(':companyId/logo')
  // @Roles(Role.ADMIN, Role.OWNER)
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

