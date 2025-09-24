import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangeRoleDto } from './dto/changeRole.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Lista usuarios, opcionalmente filtrando por compañía */
  async getActiveUsers(companyId?: string) {
    const where = {
      isActive: true,
      ...(companyId ? { companies: { some: { companyId } } } : {}),
    };

    return this.prisma.user.findMany({
      where,
      include: { companies: { include: { company: true } } },
    });
  }

  /** Obtiene detalle de un usuario activo por id */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { companies: { include: { company: true } } },
    });

    if (!user || !user.isActive)
      throw new NotFoundException('Usuario no encontrado o inactivo');

    return user;
  }

   /** Actualizar usuario (solo si está activo) */
  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.getUserById(id);
    if (!user.isActive)
      throw new ForbiddenException('No se puede actualizar un usuario inactivo');

    return this.prisma.user.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  /** Soft delete / desactivar usuario */
  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    if (!user.isActive)
      throw new BadRequestException('El usuario ya está desactivado');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  /** Listar compañías donde participa un usuario activo */
  async getUserCompanies(userId: string) {
    const user = await this.getUserById(userId);

    return this.prisma.userCompany.findMany({
      where: { userId: user.id },
      include: { company: true },
    });
  }

  /** Cambiar rol de usuario en una compañía */
  async changeRole(
    userId: string,
    companyId: string,
    dto: ChangeRoleDto,
    currentUserRole: Role,
  ) {
    // Validación: solo PROPIETARIO puede cambiar roles en su compañía
    if (currentUserRole !== Role.OWNER)
      throw new ForbiddenException('No autorizado, solo PROPIETARIOS');

    const userCompany = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!userCompany)
      throw new NotFoundException('Usuario no pertenece a esta compañía');

    // Validar que el usuario asociado a la relación esté activo
    const user = await this.getUserById(userId);
    if (!user.isActive)
      throw new ForbiddenException('No se puede cambiar rol a un usuario inactivo');


    return this.prisma.userCompany.update({
      where: { id: userCompany.id },
      data: { role: dto.role },
    });
  }

  /** Lista todos los usuarios (activos e inactivos) — SOLO SUPERADMIN */
  async getAllUsers(companyId?: string) {
    const where = companyId ? { companies: { some: { companyId } } } : {};

    return this.prisma.user.findMany({
      where,
      include: { companies: { include: { company: true } } },
    });
  }
}

