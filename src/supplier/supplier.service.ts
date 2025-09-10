// // src/supplier/supplier.service.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { CreateSupplierDto } from './dto/create-supplier.dto';

// @Injectable()
// export class SupplierService {
//   constructor(private readonly prisma: PrismaService) {}

//   async create(data: CreateSupplierDto) {
//     // Crear el supplier incluyendo la categoría
//     const supplier = await this.prisma.supplier.create({
//   data: {
//     name: data.name,
//     email: data.email,
//     phone: data.phone,
//     contactName: data.contactName,
//     address: data.address,
//     country: data.country,
//     currency: data.currency ?? [],
//     hasDebt: false,
//     pendingGoods: false,
//     category: { connect: { id: data.categoryId } },
//   },
//   include: { category: true },
// });

// if (data.companyIds?.length) {
//   await this.prisma.companySupplier.createMany({
//     data: data.companyIds.map(companyId => ({
//       companyId,
//       supplierId: supplier.id,
//     })),
//   });
// }

// return this.prisma.supplier.findUnique({
//   where: { id: supplier.id },
//   include: {
//     category: true,
//     CompanySupplier: { include: { Company: true } },
//   },
// });

//   }
// }

