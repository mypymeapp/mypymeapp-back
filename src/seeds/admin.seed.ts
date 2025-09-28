// src/seeds/admin.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminRole, Department } from '@prisma/client';

@Injectable()
export class AdminSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    console.log('🛡️ Iniciando seed de administradores...');

    // Verificar si ya existen administradores
    const existingAdmins = await this.prisma.admin.count();
    
    if (existingAdmins > 0) {
      console.log('🛡️ Administradores ya existen, saltando seed de admins...');
      return;
    }

    // Buscar usuarios que deberían ser admins
    const adminUsers = await this.prisma.user.findMany({
      where: {
        email: {
          in: ['sadmin@test.com']
        }
      }
    });

    if (adminUsers.length === 0) {
      console.log('⚠️ No se encontraron usuarios para convertir en admins');
      return;
    }

    // Crear registros de admin para usuarios específicos
    for (const user of adminUsers) {
      let role: AdminRole = AdminRole.SUPPORT;
      let department: Department = Department.TECNICO;
      
      // Asignar roles específicos basados en email
      if (user.email === 'sadmin@test.com') {
        role = AdminRole.SUPER_ADMIN;
        department = Department.TECNICO;
      }
      
      const admin = await this.prisma.admin.create({
        data: {
          userId: user.id,
          role: role,
          department: department,
          isActive: true
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      console.log(`🛡️ Admin creado: ${admin.user.name} (${admin.user.email}) - ${admin.role} - ${admin.department}`);
    }

    console.log('✅ Seed de administradores completado');
  }
}
