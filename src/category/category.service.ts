import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) {
      throw new BadRequestException(
        `Compañia con id ${data.companyId} no existe`,
      );
    }

    // validar unicidad de nombre en esa compañia -- las categorias no pueden repetirse
    const exists = await this.prisma.category.findFirst({
      where: { companyId: data.companyId, name: data.name },
    });
    if (exists) {
      throw new BadRequestException(
        `Categoria '${data.name}' ya existe en esta compañia`,
      );
    }

    return this.prisma.category.create({ data });
  }

  findAll() {
    return this.prisma.category.findMany({
      include: { company: false, products: true },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { company: false, products: true },
    });
    if (!category) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`);
    }
    return category;
  }

  async update(id: string, data: UpdateCategoryDto) {
    // 1. valida que la categoría exista
    const category = await this.findOne(id);

    // 2. si cambia el nombre, valida unicidad
    if (data.name && data.name !== category.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: { companyId: category.companyId, name: data.name },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Categoria '${data.name}' ya existe en esta compañia`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // si no queremos borrar categorías con productos asociados
    const hasProducts = await this.prisma.product.findFirst({
      where: { categoryId: id },
    });
    if (hasProducts) {
      throw new BadRequestException(
        `No se pueden borrar categorias con productos asociados`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async findByCompany(companyId: string) {
    // valida que exista la company
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    return this.prisma.category.findMany({
      where: { companyId },
      include: { products: true, company: false },
    });
  }
}

