/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilesService } from 'src/files/files.service';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
    constructor(
        private readonly companyService: CompanyService,
        private readonly filesService: FilesService,
    ) {}

    // GET /companies -> solo PLATFORM_ADMIN
    @Get()
    @Roles('ADMIN') // aquí ADMIN es la plataforma admin (o adaptar a tu enum)
    async findAll(@Req() req: Request) {
        // RolesGuard deberá verificar platform admin
        return this.companyService.listAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        // req.user debe traer: id, roles, companies[] (las companyIds a las que pertenece)
        const { user } = req;
        const isPlatformAdmin = user?.roles?.includes('ADMIN');
        const userCompanyIds = (user?.companies || []).map((c) => c.companyId);
        // si owner y no pertenece -> 403
        if (!isPlatformAdmin && !userCompanyIds.includes(id)) throw new ForbiddenException('No tienes acceso');
        return await this.companyService.getById(id);
    }

    @Post()
    async create(@Body() dto: CreateCompanyDto, @Req() req: any) {
        // cualquier user autenticado puede crear su company, se delega role PROPIETARIO
        const ownerUserId = req.user.id;
        return await this.companyService.create(dto, ownerUserId);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Req() req: any) {
        const isPlatformAdmin = req.user?.roles?.includes('ADMIN');
        const userCompanyIds = (req.user?.companies || []).map((c) => c.companyId);
        return this.companyService.update(id, dto, userCompanyIds, isPlatformAdmin);
    }

    @ApiBearerAuth()
    @Post(':id/logo')
    @UseInterceptors(FileInterceptor('logo'))
    async uploadLogo(
        @Param('id', ParseUUIDPipe) id: string,
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
        const result = await this.filesService.uploadCompanyLogo(id, file);
        return {
        message: 'Logo actualizado correctamente',
        ...result,
        };
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const isPlatformAdmin = req.user?.roles?.includes('ADMIN');
        const userCompanyIds = (req.user?.companies || []).map((c) => c.companyId);
        return this.companyService.remove(id, userCompanyIds, isPlatformAdmin);
    }

    @Get(':id/settings')
    async getSettings(@Param('id') id: string, @Req() req: any) {
        const isPlatformAdmin = req.user?.roles?.includes('ADMIN');
        const userCompanyIds = (req.user?.companies || []).map((c) => c.companyId);
        return this.companyService.getSettings(id, userCompanyIds, isPlatformAdmin);
    }

    @Patch(':id/settings')
    async updateSettings(@Param('id') id: string, @Body() dto: UpdateSettingsDto, @Req() req: any) {
        const isPlatformAdmin = req.user?.roles?.includes('ADMIN');
        const userCompanyIds = (req.user?.companies || []).map((c) => c.companyId);
        return this.companyService.updateSettings(id, dto, userCompanyIds, isPlatformAdmin);
    }
}

