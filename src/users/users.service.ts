import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangeRoleDto } from './dto/changeRole.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    /** Lista usuarios, opcionalmente filtrando por compañía */
    async getUsers(companyId?: string) {
        const where = companyId
        ? { companies: { some: { companyId } } }
        : {};

        return this.prisma.user.findMany({
            where,
            include: { companies: { include: { company: true } } },
        });
    }

    /** Obtiene detalle de un usuario por id */
    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { companies: { include: { company: true } } },
        });
        
        if (!user) throw new NotFoundException('Usuario no encontrado');
        
        return user;
    }

    /** Actualizar usuario */
    async updateUser(id: string, dto: UpdateUserDto) {
        await this.getUserById(id); // validar existencia
        
        return this.prisma.user.update({
            where: { id },
            data: { ...dto, updatedAt: new Date() },
        });
    }

    /** Soft delete / desactivar usuario */
    async deleteUser(id: string) {
        await this.getUserById(id);
        
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false, updatedAt: new Date() },
        });
    }

    /** Listar compañías donde participa un usuario */
    async getUserCompanies(userId: string) {
        await this.getUserById(userId);
        
        return this.prisma.userCompany.findMany({
            where: { userId },
            include: { company: true },
        });
    }

    /** Cambiar rol de usuario en una compañía */
    async changeRole(userId: string, companyId: string, dto: ChangeRoleDto, currentUserRole: Role) {
        // Validación: solo PROPIETARIO puede cambiar roles en su compañía
        if (currentUserRole !== Role.OWNER) throw new ForbiddenException('No autorizado, solo PROPIETARIOS');

        const userCompany = await this.prisma.userCompany.findUnique({
            where: { userId_companyId: { userId, companyId } },
        });
        
        if (!userCompany) throw new NotFoundException('Usuario no pertenece a esta compañía');

        return this.prisma.userCompany.update({
            where: { id: userCompany.id },
            data: { role: dto.role },
        });
    }
}

