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
import { EditUserDto } from './dto/editUser.dto';
import { AdminResetPasswordDto } from './dto/resetPassword.dto';
import * as bcrypt from 'bcrypt';

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
    const where = {
      deletedAt: null, // Solo usuarios no eliminados
      ...(companyId ? { companies: { some: { companyId } } } : {})
    };

    return this.prisma.user.findMany({
      where,
      include: { 
        companies: { include: { company: true } },
        admin: true // Incluir información de admin si existe
      },
    });
  }

  /** Obtener usuarios con información completa para el panel de administración */
  async getUsersForAdmin() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null // Solo usuarios no eliminados
      },
      include: {
        admin: true,
        companies: { include: { company: true } },
        _count: {
          select: {
            tickets: true,
            companies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformar datos para el frontend
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      avatarUrl: user.avatarUrl,
      isAdmin: !!user.admin,
      adminRole: user.admin?.role,
      adminDepartment: user.admin?.department,
      ticketsCount: user._count.tickets,
      companiesCount: user._count.companies
    }));
  }

  /** Obtener todos los clientes (usuarios no admin) con sus empresas */
  async getAllClients() {
    const clients = await this.prisma.user.findMany({
      where: {
        deletedAt: null, // Solo usuarios no eliminados
        admin: null, // Solo usuarios que NO son admin
        companies: {
          some: {} // Solo usuarios que tienen al menos una empresa
        }
      },
      include: {
        companies: {
          include: {
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                    products: true,
                    customers: true,
                    transactions: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            companies: true,
            transactions: true,
            tickets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformar datos para el frontend
    return clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      avatarUrl: client.avatarUrl,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      deletedAt: client.deletedAt?.toISOString() || null,
      companies: client.companies.map(userCompany => ({
        id: userCompany.id,
        role: userCompany.role,
        createdAt: userCompany.createdAt.toISOString(),
        company: {
          id: userCompany.company.id,
          name: userCompany.company.name,
          mail: userCompany.company.mail,
          pais: userCompany.company.pais,
          razonSocial: userCompany.company.razonSocial,
          rubroPrincipal: userCompany.company.rubroPrincipal,
          rut_Cuit: userCompany.company.rut_Cuit,
          subscriptionStatus: userCompany.company.subscriptionStatus,
          subscriptionEndDate: userCompany.company.subscriptionEndDate?.toISOString() || null,
          createdAt: userCompany.company.createdAt.toISOString(),
          logoFileId: userCompany.company.logoFileId,
          _count: userCompany.company._count
        }
      })),
      _count: client._count
    }));
  }

  /** Obtener clientes eliminados (para administración) */
  async getDeletedClients() {
    const clients = await this.prisma.user.findMany({
      where: {
        deletedAt: { not: null }, // Solo usuarios eliminados
        admin: null, // Solo usuarios que NO son admin
        companies: {
          some: {} // Solo usuarios que tienen al menos una empresa
        }
      },
      include: {
        companies: {
          include: {
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                    products: true,
                    customers: true,
                    transactions: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            companies: true,
            transactions: true,
            tickets: true
          }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });

    // Transformar datos para el frontend
    return clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      avatarUrl: client.avatarUrl,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      deletedAt: client.deletedAt?.toISOString() || null,
      companies: client.companies.map(userCompany => ({
        id: userCompany.id,
        role: userCompany.role,
        createdAt: userCompany.createdAt.toISOString(),
        company: {
          id: userCompany.company.id,
          name: userCompany.company.name,
          mail: userCompany.company.mail,
          pais: userCompany.company.pais,
          razonSocial: userCompany.company.razonSocial,
          rubroPrincipal: userCompany.company.rubroPrincipal,
          rut_Cuit: userCompany.company.rut_Cuit,
          subscriptionStatus: userCompany.company.subscriptionStatus,
          subscriptionEndDate: userCompany.company.subscriptionEndDate?.toISOString() || null,
          createdAt: userCompany.company.createdAt.toISOString(),
          logoFileId: userCompany.company.logoFileId,
          _count: userCompany.company._count
        }
      })),
      _count: client._count
    }));
  }

  /** Crear nuevo cliente con empresa */
  async createClient(dto: any) {
    const { name, email, password, role, company } = dto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está en uso');
    }

    // Verificar si la empresa ya existe por email o RUT/CUIT
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [
          { mail: company.mail },
          { rut_Cuit: company.rut_Cuit }
        ]
      }
    });

    if (existingCompany) {
      throw new BadRequestException('Ya existe una empresa con ese email o RUT/CUIT');
    }

    // Hash de las contraseñas
    const userPasswordHash = await bcrypt.hash(password, 10);
    const companyPasswordHash = await bcrypt.hash(company.passwordHash, 10);

    // Crear usuario y empresa en transacción
    return this.prisma.$transaction(async (prisma) => {
      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: userPasswordHash,
          isActive: true
        }
      });

      // Crear empresa
      const newCompany = await prisma.company.create({
        data: {
          name: company.name,
          mail: company.mail,
          pais: company.pais,
          razonSocial: company.razonSocial,
          rubroPrincipal: company.rubroPrincipal,
          rut_Cuit: company.rut_Cuit,
          passwordHash: companyPasswordHash,
          subscriptionStatus: 'FREE'
        }
      });

      // Crear relación UserCompany
      await prisma.userCompany.create({
        data: {
          userId: newUser.id,
          companyId: newCompany.id,
          role: role || 'OWNER'
        }
      });

      // Retornar usuario con información completa
      const clientWithCompanies = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: {
          companies: {
            include: {
              company: {
                include: {
                  _count: {
                    select: {
                      members: true,
                      products: true,
                      customers: true,
                      transactions: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              companies: true,
              transactions: true,
              tickets: true
            }
          }
        }
      });

      if (!clientWithCompanies) {
        throw new BadRequestException('Error al crear el cliente');
      }

      // Transformar datos para el frontend
      return {
        id: clientWithCompanies.id,
        name: clientWithCompanies.name,
        email: clientWithCompanies.email,
        avatarUrl: clientWithCompanies.avatarUrl,
        isActive: clientWithCompanies.isActive,
        createdAt: clientWithCompanies.createdAt.toISOString(),
        updatedAt: clientWithCompanies.updatedAt.toISOString(),
        deletedAt: clientWithCompanies.deletedAt?.toISOString() || null,
        companies: clientWithCompanies.companies.map(userCompany => ({
          id: userCompany.id,
          role: userCompany.role,
          createdAt: userCompany.createdAt.toISOString(),
          company: {
            id: userCompany.company.id,
            name: userCompany.company.name,
            mail: userCompany.company.mail,
            pais: userCompany.company.pais,
            razonSocial: userCompany.company.razonSocial,
            rubroPrincipal: userCompany.company.rubroPrincipal,
            rut_Cuit: userCompany.company.rut_Cuit,
            subscriptionStatus: userCompany.company.subscriptionStatus,
            subscriptionEndDate: userCompany.company.subscriptionEndDate?.toISOString() || null,
            createdAt: userCompany.company.createdAt.toISOString(),
            logoFileId: userCompany.company.logoFileId,
            _count: userCompany.company._count
          }
        })),
        _count: clientWithCompanies._count
      };
    });
  }

  /** Editar usuario completo incluyendo promoción/degradación de admin */
  async editUser(id: string, dto: EditUserDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { admin: true }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar email único si se está cambiando
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });
      
      if (emailExists) {
        throw new BadRequestException('El email ya está en uso por otro usuario');
      }
    }

    // Iniciar transacción para manejar cambios de usuario y admin
    return this.prisma.$transaction(async (prisma) => {
      // Actualizar información básica del usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.email && { email: dto.email }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          updatedAt: new Date()
        },
        include: { admin: true }
      });

      // Manejar cambios de estado de administrador
      if (dto.isAdmin !== undefined) {
        if (dto.isAdmin && !existingUser.admin) {
          // Promover a administrador
          await prisma.admin.create({
            data: {
              userId: id,
              role: dto.adminRole || 'SUPPORT',
              department: dto.adminDepartment || 'TECNICO',
              isActive: true
            }
          });
        } else if (!dto.isAdmin && existingUser.admin) {
          // Degradar de administrador
          await prisma.admin.delete({
            where: { userId: id }
          });
        } else if (dto.isAdmin && existingUser.admin) {
          // Actualizar información de admin existente
          const adminUpdateData: any = {};
          if (dto.adminRole !== undefined) {
            adminUpdateData.role = dto.adminRole;
          }
          if (dto.adminDepartment !== undefined) {
            adminUpdateData.department = dto.adminDepartment;
          }
          
          // Solo actualizar si hay cambios
          if (Object.keys(adminUpdateData).length > 0) {
            await prisma.admin.update({
              where: { userId: id },
              data: adminUpdateData
            });
          }
        }
      } else if (existingUser.admin && (dto.adminRole !== undefined || dto.adminDepartment !== undefined)) {
        // Caso especial: actualizar solo rol/departamento sin cambiar estado de admin
        const adminUpdateData: any = {};
        if (dto.adminRole !== undefined) {
          adminUpdateData.role = dto.adminRole;
        }
        if (dto.adminDepartment !== undefined) {
          adminUpdateData.department = dto.adminDepartment;
        }
        
        if (Object.keys(adminUpdateData).length > 0) {
          await prisma.admin.update({
            where: { userId: id },
            data: adminUpdateData
          });
        }
      }

      // Retornar usuario actualizado con información de admin
      return prisma.user.findUnique({
        where: { id },
        include: { 
          admin: true,
          companies: { include: { company: true } }
        }
      });
    });
  }

  /** Reset de contraseña a una temporal */
  async resetPassword(id: string, dto: AdminResetPasswordDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generar contraseña temporal
    const temporaryPassword = dto.temporaryPassword || 'temp123456';
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Actualizar contraseña
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    });

    return {
      message: 'Contraseña reseteada exitosamente',
      temporaryPassword: temporaryPassword,
      userId: id,
      userName: existingUser.name
    };
  }

  /** Crear nuevo usuario desde panel de administración */
  async createUser(dto: any, currentUserAdminRole?: string) {
    const { name, email, password, isAdmin, adminRole, adminDepartment } = dto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está en uso');
    }

    // Validar que solo SUPER_ADMIN pueda crear usuarios administradores
    if (isAdmin && currentUserAdminRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo los Super Administradores pueden crear usuarios administradores');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario en transacción
    return this.prisma.$transaction(async (prisma) => {
      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          isActive: true
        }
      });

      // Si es administrador, crear registro de admin
      if (isAdmin) {
        await prisma.admin.create({
          data: {
            userId: newUser.id,
            role: adminRole || 'SUPPORT',
            department: adminDepartment || 'TECNICO',
            isActive: true
          }
        });
      }

      // Retornar usuario con información de admin
      const userWithAdmin = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: { admin: true }
      });

      if (!userWithAdmin) {
        throw new BadRequestException('Error al crear el usuario');
      }

      // Transformar datos para el frontend
      return {
        id: userWithAdmin.id,
        name: userWithAdmin.name,
        email: userWithAdmin.email,
        isActive: userWithAdmin.isActive,
        createdAt: userWithAdmin.createdAt.toISOString(),
        updatedAt: userWithAdmin.updatedAt.toISOString(),
        avatarUrl: userWithAdmin.avatarUrl,
        isAdmin: !!userWithAdmin.admin,
        adminRole: userWithAdmin.admin?.role,
        adminDepartment: userWithAdmin.admin?.department,
        ticketsCount: 0,
        companiesCount: 0
      };
    });
  }

  /** Soft delete de usuario - marca como eliminado sin borrar datos */
  async softDeleteUser(id: string) {
    // Verificar que el usuario existe y no está ya eliminado
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { admin: true }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (existingUser.deletedAt) {
      throw new BadRequestException('El usuario ya está eliminado');
    }

    // Verificar si es administrador activo
    if (existingUser.admin && existingUser.admin.isActive) {
      throw new BadRequestException(
        'No se puede eliminar un usuario administrador activo. Primero remueve sus privilegios de administrador.'
      );
    }

    // Realizar soft delete en transacción
    return this.prisma.$transaction(async (prisma) => {
      // Marcar usuario como eliminado
      const deletedUser = await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false, // También desactivar el usuario
          updatedAt: new Date()
        },
        include: { admin: true }
      });

      // Si tiene admin, también desactivar el admin
      if (existingUser.admin) {
        await prisma.admin.update({
          where: { userId: id },
          data: {
            isActive: false
          }
        });
      }

      return {
        message: 'Usuario eliminado exitosamente',
        userId: id,
        userName: existingUser.name,
        deletedAt: deletedUser.deletedAt
      };
    });
  }

  /** Restaurar usuario eliminado (soft delete reverso) */
  async restoreUser(id: string) {
    // Verificar que el usuario existe (incluyendo eliminados)
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        id,
        deletedAt: { not: null } // Solo usuarios eliminados
      },
      include: { admin: true }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado o no está eliminado');
    }

    // Restaurar usuario
    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true, // Reactivar el usuario
        updatedAt: new Date()
      }
    });

    return {
      message: 'Usuario restaurado exitosamente',
      userId: id,
      userName: existingUser.name,
      restoredAt: new Date()
    };
  }

  /** Obtener usuarios eliminados (para administración) */
  async getDeletedUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: { not: null } // Solo usuarios eliminados
      },
      include: {
        admin: true,
        _count: {
          select: {
            tickets: true,
            companies: true
          }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });

    // Transformar datos para el frontend
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString(),
      avatarUrl: user.avatarUrl,
      isAdmin: !!user.admin,
      adminRole: user.admin?.role,
      adminDepartment: user.admin?.department,
      ticketsCount: user._count.tickets,
      companiesCount: user._count.companies
    }));
  }
}

