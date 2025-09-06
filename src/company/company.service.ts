import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { FilesService } from '../files/files.service';

@Injectable()
    export class CompanyService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService, 
    ) {}

    async createCompany(data: {
        name: string;
        mail: string;
        passwordHash: string;
        pais: string;
        razonSocial: string;
        rut_Cuit: string;
        rubroPrincipal: string;
    }) {
        const existing = await this.prisma.company.findFirst({
            where: {
                OR: [{ mail: data.mail }, { rut_Cuit: data.rut_Cuit }],
            },
        });
        if (existing) { throw new ConflictException( 'Ya existe una empresa con ese mail o RUT/CUIT' ); }

        return this.prisma.company.create({
            data: {
                name: data.name,
                mail: data.mail,
                passwordHash: data.passwordHash,
                pais: data.pais,
                razonSocial: data.razonSocial,
                rut_Cuit: data.rut_Cuit,
                rubroPrincipal: data.rubroPrincipal,
                settings: { create: {} }, // nested relation
            },
        });
    }

    async getCompanies() {
            return this.prisma.company.findMany({
            include: { settings: true, members: true },
        });
    }

    async getCompanyById(id: string) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { settings: true, members: true },
        });
        if (!company) throw new NotFoundException('Empresa no encontrada');
        return company;
    }

    async updateCompany(id: string, data: any) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Empresa no encontrada');

        return this.prisma.company.update({
            where: { id },
            data,
        });
    }

    async deleteCompany(id: string) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Empresa no encontrada');

        return this.prisma.company.delete({ where: { id } });
    }

    async getSettings(companyId: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { settings: true },
        });

        if (!company) {
            throw new NotFoundException(`Empresa con id ${companyId} no encontrada`);
        }

        return company.settings;
    }

    async updateSettings(companyId: string, data: any) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) throw new NotFoundException('Empresa no encontrada');

        return this.prisma.companySettings.update({
            where: { companyId },
            data,
        });
    }

    async addMember(companyId: string, userId: string, role: Role) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Empresa no encontrada');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const existingMember = await this.prisma.userCompany.findFirst({
            where: { userId, companyId },
        });
        if (existingMember) {
            throw new ConflictException('El usuario ya pertenece a esta compañía');
        }

        return this.prisma.userCompany.create({
            data: { companyId, userId, role },
        });
    }

    async updateMemberRole(companyId: string, userId: string, role: Role) {
        const member = await this.prisma.userCompany.findUnique({
            where: { userId_companyId: { userId, companyId } },
        });
        if (!member) throw new NotFoundException('El miembro no existe en esta empresa');

        return this.prisma.userCompany.update({
            where: { userId_companyId: { userId, companyId } },
            data: { role },
        });
    }

    async removeMember(companyId: string, userId: string) {
        const member = await this.prisma.userCompany.findUnique({
            where: { userId_companyId: { userId, companyId } },
        });
        if (!member) throw new NotFoundException('El miembro no existe en esta empresa');

        return this.prisma.userCompany.delete({
            where: { userId_companyId: { userId, companyId } },
        });
    }

    async uploadLogo(companyId: string, file: Express.Multer.File) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Empresa no encontrada');

        const result = await this.filesService.uploadCompanyLogo(companyId, file);

        await this.prisma.company.update({
            where: { id: companyId },
            data: { logoFileId: result.fileId },
        });

        return result; // { logoUrl, fileId }
    }
}


