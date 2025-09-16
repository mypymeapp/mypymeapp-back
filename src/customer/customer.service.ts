import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(data: CreateCustomerDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) {
      throw new NotFoundException(
        `Company with id ${data.companyId} not found`,
      );
    }

    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        memberSince: data.memberSince ?? new Date(),
        notes: data.notes,
        companyId: data.companyId,
      },
    });
  }

  async getAllCustomers() {
    return this.prisma.customer.findMany({
      include: { company: true }, // opcional, incluye datos de la compañía
    });
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!customer)
      throw new NotFoundException(`Customer with id ${id} not found`);

    return customer;
  }

  async getCustomersByCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    return this.prisma.customer.findMany({
      where: { companyId },
      include: { company: true },
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerDto) {
    // validar que exista
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) {
        throw new NotFoundException(
          `Company with id ${data.companyId} not found`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data,
      include: { company: true },
    });
  }

  async deleteCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return this.prisma.customer.delete({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }
}

