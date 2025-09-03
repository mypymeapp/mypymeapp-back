/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
// import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CompanyService {
    constructor(
        private prisma: PrismaService,
        // private eventEmitter: EventEmitter2,
    ) {}

    // List all companies — solo PLATFORM_ADMIN (comprobación en controller/guard)
    async listAll() {
        return await this.prisma.company.findMany({
            include: { settings: true, members: true },
        });
    }

    async getById(id: string) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { settings: true, members: true },
        });
        if (!company) throw new NotFoundException('Company not found');
        return company;
    }

    async create(dto: CreateCompanyDto, ownerUserId: string) {
        // Opcional: chequear duplicados por nombre
        const existing = await this.prisma.company.findFirst({ where: { name: dto.name } });
        if (existing) throw new ConflictException('Company name already exists');

        // transacción: crear company + settings + userCompany(owner)
        const result = await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
            data: {
                name: dto.name,
                logoFileId: dto.logoFileId ?? null,
                // currency: dto.currency ?? process.env.DEFAULT_CURRENCY ?? 'USD',
                locale: dto.locale ?? process.env.DEFAULT_LOCALE ?? 'es-UY',
                timezone: dto.timezone ?? process.env.DEFAULT_TZ ?? 'America/Montevideo',
            },
        });

        await tx.companySettings.create({
            data: { companyId: company.id, },      // defaults from schema handled by Prisma           
        });

        await tx.userCompany.create({
            data: {
                userId: ownerUserId,
                companyId: company.id,
                role: 'PROPIETARIO',
            },
        });

        return company;
        });

        // evento
        // this.eventEmitter.emit('company.created', { company: result, ownerUserId });

        return result;
    }

    async update(id: string, dto: UpdateCompanyDto, requestingUserCompanyIds: string[], isPlatformAdmin: boolean) {
        // Acceso: o platform admin o pertenece a la company (check in controller but re-check here)
        if (!isPlatformAdmin && !requestingUserCompanyIds.includes(id)) {
            throw new ForbiddenException('No tienes acceso a esa compañía');
        }

        // Check name duplicate (if name provided)
        if (dto.name) {
            const existing = await this.prisma.company.findFirst({
                where: { name: dto.name, NOT: { id } },
            });
            if (existing) throw new ConflictException('Company name already exists');
        }

        return this.prisma.company.update({
            where: { id },
            data: { ...dto },
        });
    }

    async remove(id: string, requestingUserCompanyIds: string[], isPlatformAdmin: boolean) {
        if (!isPlatformAdmin && !requestingUserCompanyIds.includes(id)) {
            throw new ForbiddenException('No tienes acceso a eliminar esa compañía');
        }

        // Puedes decidir soft delete. Aquí hard delete con transaction para relaciones.
        return await this.prisma.$transaction(async (tx) => {
            // borrar settings si existe
            await tx.companySettings.deleteMany({ where: { companyId: id } });
            // borrar userCompany
            await tx.userCompany.deleteMany({ where: { companyId: id } });
            // borrar company
            return tx.company.delete({ where: { id } });
        });
    }

    async getSettings(companyId: string, requestingUserCompanyIds: string[], isPlatformAdmin: boolean) {
        if (!isPlatformAdmin && !requestingUserCompanyIds.includes(companyId)) {
            throw new ForbiddenException('No tienes acceso a esa configuración');
        }

        const settings = await this.prisma.companySettings.findUnique({
            where: { companyId },
        });

        if (!settings) throw new NotFoundException('Company settings not found');

        return settings;
    }

    async updateSettings(companyId: string, dto: UpdateSettingsDto, requestingUserCompanyIds: string[], isPlatformAdmin: boolean) {
        if (!isPlatformAdmin && !requestingUserCompanyIds.includes(companyId)) {
            throw new ForbiddenException('No tienes acceso a esa configuración');
        }

        // upsert para asegurar existencia
        return await this.prisma.companySettings.upsert({
            where: { companyId },
            create: { companyId, ...dto },
            update: { ...dto },
        });
    }
}

