import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { FilesService } from '../files/files.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/mail/mail.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private emailService: EmailService,
  ) {}

  async createCompany(data: {
    name: string;
    mail: string;
    password: string;
    pais: string;
    razonSocial: string;
    rut_Cuit: string;
    rubroPrincipal: string;
    userId: string;
  }) {
    // verificar duplicados
    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [{ mail: data.mail }, { rut_Cuit: data.rut_Cuit }],
      },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe una empresa con ese mail o RUT/CUIT',
      );
    }

    // verificar que el usuario exista
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.name,
          mail: data.mail,
          passwordHash: hashedPassword,
          pais: data.pais,
          razonSocial: data.razonSocial,
          rut_Cuit: data.rut_Cuit,
          rubroPrincipal: data.rubroPrincipal,
          settings: { create: {} },
        },
        select: {
          id: true,
          name: true,
          mail: true,
          pais: true,
          razonSocial: true,
          rut_Cuit: true,
          rubroPrincipal: true,
          logoFileId: true,
          createdAt: true,
          settings: true,
        },
      });

      await tx.userCompany.create({
        data: {
          userId: data.userId,
          companyId: company.id,
          role: 'OWNER',
        },
      });

      return company;
    });

    try {
      const recipientEmail = result.mail || user.email; // si no hay mail de empresa, usa el del usuario
      const recipientName = result.mail ? result.name : user.name;

      await this.emailService.sendWelcomeEmail(recipientName, recipientEmail);
    } catch (error) {
      console.error('Error enviando mail de bienvenida:', error.message);
      // no lanzamos excepción para no romper el flujo de creación
    }
    return result;
  }

  async getCompanies() {
    return this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        mail: true,
        pais: true,
        razonSocial: true,
        rut_Cuit: true,
        rubroPrincipal: true,
        logoFileId: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        settings: true,
        members: true,
      },
    });
  }

  async getCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        mail: true,
        pais: true,
        razonSocial: true,
        rut_Cuit: true,
        rubroPrincipal: true,
        logoFileId: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        settings: true,
        members: true,
      },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async updateCompany(id: string, data: Partial<any>) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    return this.prisma.company.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        mail: true,
        pais: true,
        razonSocial: true,
        rut_Cuit: true,
        rubroPrincipal: true,
        logoFileId: true,
        createdAt: true,
      },
    });
  }

  async deleteCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    return this.prisma.company.delete({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
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
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    // Validación de suscripción PREMIUM
    if (company.subscriptionStatus !== 'PREMIUM') {
      throw new ForbiddenException(
        'Solo las empresas con plan PREMIUM pueden agregar miembros',
      );
    }

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
    if (!member)
      throw new NotFoundException('El miembro no existe en esta empresa');

    return this.prisma.userCompany.update({
      where: { userId_companyId: { userId, companyId } },
      data: { role },
    });
  }

  async removeMember(companyId: string, userId: string) {
    const member = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!member)
      throw new NotFoundException('El miembro no existe en esta empresa');

    return this.prisma.userCompany.delete({
      where: { userId_companyId: { userId, companyId } },
    });
  }

  async getInventory(companyId: string) {
    // Validar existencia de la empresa
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    // Traer productos con su qty actual
    return this.prisma.product.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        sku: true,
        qty: true, // campo que se va actualizando en movimientos
        price: true,
        cost: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async uploadLogo(companyId: string, file: Express.Multer.File) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const result = await this.filesService.uploadCompanyLogo(companyId, file);

    await this.prisma.company.update({
      where: { id: companyId },
      data: { logoFileId: result.fileId },
    });

    return result; // { logoUrl, fileId }
  }
}

