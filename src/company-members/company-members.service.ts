import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthLib } from 'src/auth/utils/auth.lib';
import { EmailService } from 'src/mail/mail.service';
import { CreateCompanyMemberDto } from './dto/create-company-member.dto';
import { UpdateCompanyMemberDto } from './dto/update-company-member.dto';

@Injectable()
export class CompanyMembersService {
  constructor(
    private prisma: PrismaService,
    private authLib: AuthLib,
    private emailService: EmailService,
  ) {}

  async addMember(companyId: string, dto: CreateCompanyMemberDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ForbiddenException('User already exists with that email');
    }

    const passwordHash = await this.authLib.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    try {
      await this.emailService.sendWelcomeEmail(user.name, user.email);
    } catch (err) {
      console.error('Error enviando correo bienvenida:', err);
    }

    const member = await this.prisma.userCompany.create({
      data: {
        userId: user.id,
        companyId,
        role: dto.role ?? 'EMPLOYEE',
      },
    });

    return { user, member };
  }

  async getMembers(companyId: string) {
    return this.prisma.userCompany.findMany({
      where: { companyId },
      include: { user: true },
    });
  }

  async updateMember(
    companyId: string,
    userId: string,
    dto: UpdateCompanyMemberDto,
  ) {
    // Actualizar rol en UserCompany
    if (dto.role) {
      await this.prisma.userCompany.update({
        where: {
          userId_companyId: { userId, companyId },
        },
        data: { role: dto.role },
      });
    }

    // Actualizar datos del usuario
    const userUpdate: any = {};
    if (dto.name) userUpdate.name = dto.name;
    if (dto.isActive !== undefined) userUpdate.isActive = dto.isActive;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    return this.prisma.userCompany.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
      include: { user: true },
    });
  }

  async removeMember(companyId: string, userId: string) {
    // Eliminar la relación sin borrar el usuario
    return this.prisma.userCompany.delete({
      where: {
        userId_companyId: { userId, companyId },
      },
    });
  }
}

