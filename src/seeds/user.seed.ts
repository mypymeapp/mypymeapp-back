import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log('Users already exist, skipping user seeding.');
    return;
  }

  const usersData = [
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
    {
      name: 'Olivia Miller',
      email: 'olivia.miller@example.com',
      password: 'Pass6789!',
    },
    {
      name: 'James Davis',
      email: 'james.davis@example.com',
      password: 'Pass7890!',
    },
    {
      name: 'Sophia Wilson',
      email: 'sophia.wilson@example.com',
      password: 'Pass8901!',
    },
    {
      name: 'William Taylor',
      email: 'william.taylor@example.com',
      password: 'Pass9012!',
    },
    {
      name: 'Isabella Anderson',
      email: 'isabella.anderson@example.com',
      password: 'Pass0123!',
    },
  ];
  const data = await Promise.all(
    usersData.map(async (user) => ({
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
    })),
  );

  await prisma.user.createMany({
    data,
  });

  console.log('✅ Seed of 10 Users executed');
}

