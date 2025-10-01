// // src/seeds/user.seed.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class UserSeed {
//   constructor(private readonly prisma: PrismaService) {}

//   async run() {
//     const count = await this.prisma.user.count();
//     if (count > 0) {
//       console.log('Seed - Users: already exist, skipping user seeding.');
//       return;
//     }

//     const usersData = [
//       {
//         name: 'John Smith',
//         email: 'john.smith@example.com',
//         password: 'Pass1234!',
//       },
//       {
//         name: 'Emily Johnson',
//         email: 'emily.johnson@example.com',
//         password: 'Pass2345!',
//       },
//       {
//         name: 'Michael Williams',
//         email: 'michael.williams@example.com',
//         password: 'Pass3456!',
//       },
//       {
//         name: 'Sarah Brown',
//         email: 'sarah.brown@example.com',
//         password: 'Pass4567!',
//       },
//       {
//         name: 'David Jones',
//         email: 'david.jones@example.com',
//         password: 'Pass5678!',
//       },
//       {
//         name: 'Olivia Miller',
//         email: 'olivia.miller@example.com',
//         password: 'Pass6789!',
//       },
//       {
//         name: 'James Davis',
//         email: 'james.davis@example.com',
//         password: 'Pass7890!',
//       },
//       {
//         name: 'Sophia Wilson',
//         email: 'sophia.wilson@example.com',
//         password: 'Pass8901!',
//       },
//       {
//         name: 'William Taylor',
//         email: 'william.taylor@example.com',
//         password: 'Pass9012!',
//       },
//       {
//         name: 'Isabella Anderson',
//         email: 'isabella.anderson@example.com',
//         password: 'Pass0123!',
//       },
//     ];

//     const data = await Promise.all(
//       usersData.map(async (user) => ({
//         name: user.name,
//         email: user.email,
//         passwordHash: await bcrypt.hash(user.password, 10),
//       })),
//     );

//     await this.prisma.user.createMany({ data });

//     console.log('✅ Seed of 10 Users executed');
//   }
// }

// src/seeds/user.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UserSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.user.count();
    if (count > 0) {
      console.log('Seed - Users: already exist, skipping user seeding.');
      return;
    }

    // Traemos todas las compañías creadas en el company.seed
    const companies = await this.prisma.company.findMany();

    if (companies.length < 5) {
      console.log(
        '❌ Debe haber al menos 5 compañías para asociar los usuarios.',
      );
      return;
    }

    // Definimos los usuarios (6, uno será super admin y 5 para las companies)
    const usersData = [
      {
        name: 'Super Admin',
        email: 'sadmin@test.com',
        password: 'Admin123!',
      },
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'Pass1234!',
      },
      {
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
        password: 'Pass2345!',
      },
      {
        name: 'Michael Williams',
        email: 'michael.williams@example.com',
        password: 'Pass3456!',
      },
      {
        name: 'Sarah Brown',
        email: 'sarah.brown@example.com',
        password: 'Pass4567!',
      },
      {
        name: 'David Jones',
        email: 'david.jones@example.com',
        password: 'Pass5678!',
      },
    ];

    for (let i = 0; i < usersData.length; i++) {
      const user = usersData[i];
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // El primer usuario (Super Admin) no se asocia a ninguna compañía
      if (i === 0) {
        const createdUser = await this.prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            passwordHash: hashedPassword,
          },
        });

        console.log(
          `👤 Super Admin '${createdUser.name}' created (no company association)`,
        );
      } else {
        // Los demás usuarios se asocian a las compañías
        const company = companies[i - 1]; // ajustamos el índice porque el primer usuario no tiene compañía

        const createdUser = await this.prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            passwordHash: hashedPassword,
            companies: {
              create: {
                companyId: company.id,
                role: Role.OWNER,
              },
            },
          },
        });

        console.log(
          `👤 User '${createdUser.name}' created and asociated to company '${company.name}'`,
        );
      }
    }

    console.log('✅ Seed of 6 users created (1 Super Admin + 5 company users).');
  }
}

