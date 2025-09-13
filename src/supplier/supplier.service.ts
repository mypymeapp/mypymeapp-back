import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { randomUUID } from 'crypto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async createSupplier(data: CreateSupplierDto) {
    // verificar que la company exista
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) throw new NotFoundException('Company does not exist');

    // verificar que la categoría exista
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new NotFoundException('Category does not exist');

    // verificar que no exista ya un supplier con el mismo email
    let supplier = await this.prisma.supplier.findUnique({
      where: { email: data.email },
    });

    if (!supplier) {
      // crear supplier nuevo
      supplier = await this.prisma.supplier.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          contactName: data.contactName,
          address: data.address,
          country: data.country,
          category: { connect: { id: data.categoryId } }, // conecta relación
          hasDebt: false,
          pendingGoods: false,
          currency: [], // si quieres agregar monedas, pasalas aquí
        },
      });
    }

    // verificar si ya está asociado a esa empresa
    const existingRelation = await this.prisma.companySupplier.findUnique({
      where: {
        companyId_supplierId: {
          companyId: data.companyId,
          supplierId: supplier.id,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException(
        'El proveedor ya está asociado a esta empresa',
      );
    }

    // asociar supplier a la empresa
    await this.prisma.companySupplier.create({
      data: {
        id: randomUUID(),
        companyId: data.companyId,
        supplierId: supplier.id,
      },
    });

    return supplier;
  }

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        category: true,
        CompanySupplier: {
          include: { Company: true },
        },
      },
    });
  }

  async getSupplierById(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        category: true,
        CompanySupplier: {
          include: { Company: true },
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }
  async getSuppliersByCompany(companyId: string) {
    return this.prisma.supplier.findMany({
      where: {
        CompanySupplier: {
          some: { companyId },
        },
      },
    });
  }

  async updateSupplier(supplierId: string, data: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data,
    });
  }

  async deleteSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    await this.prisma.companySupplier.deleteMany({
      where: { supplierId },
    });

    return this.prisma.supplier.delete({
      where: { id: supplierId },
    });
  }
}

