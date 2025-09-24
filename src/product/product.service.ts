import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateProductDto) {
        // 1. Validar que la empresa existe
        const company = await this.prisma.company.findUnique({
            where: { id: data.companyId },
        });
        if (!company) {
            throw new BadRequestException(`Company with id ${data.companyId} does not exist`);
        }

        // 2. Validar unicidad de SKU dentro de la empresa
        const skuExists = await this.prisma.product.findFirst({
            where: { companyId: data.companyId, sku: data.sku },
        });
        if (skuExists) {
        throw new BadRequestException(
            `SKU '${data.sku}' already exists in this company`,
        );
        }

        // 3. Validar categoría (si existe)
        if (data.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new BadRequestException(
                `Category with id ${data.categoryId} does not exist`,
                );
            }
        }

        // 4. Crear producto
        const { imageFileIds, ...productData } = data;
        const product = await this.prisma.product.create({
            data: productData,
        });

        // 5. Asociar imágenes si vienen
        if (imageFileIds && imageFileIds.length > 0) {
            for (const fileId of imageFileIds) {
                await this.prisma.productImage.create({
                    data: { productId: product.id, fileId },
                });
            }
        }

        return this.findOne(product.id);
    }

    findAll() {
        return this.prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                company: true,
                category: true,
                images: { include: { file: true } },
            },
        });
    }

    findAllProducts() {
        return this.prisma.product.findMany({
            include: {
                company: true,
                category: true,
                images: { include: { file: true } },
            },
        });
    }

    async findOne(id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: {
                company: true,
                category: true,
                images: { include: { file: true } },
            },
        });
        if (!product) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }
        return product;
    }

    async update(id: string, data: UpdateProductDto) {
        const product = await this.findOne(id);

        // Validar SKU único si se actualiza
        if (data.sku && data.sku !== product.sku) {
            const duplicate = await this.prisma.product.findFirst({
                where: { companyId: product.companyId, sku: data.sku },
            });
            if (duplicate) {
                throw new BadRequestException(
                `SKU '${data.sku}' already exists in this company`,
                );
            }
        }

        // Validar categoría si se actualiza
        if (data.categoryId && data.categoryId !== product.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new BadRequestException(
                    `Category with id ${data.categoryId} does not exist`,
                );
            }
        }

        // Actualizar datos básicos
        const { imageFileIds, ...updateData } = data;
        await this.prisma.product.update({
            where: { id },
            data: updateData,
        });

        // Si vienen nuevas imágenes → reemplazar
        if (imageFileIds) {
        await this.prisma.productImage.deleteMany({ where: { productId: id } });
            for (const fileId of imageFileIds) {
                await this.prisma.productImage.create({
                    data: { productId: id, fileId },
                });
            }
        }
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id); 
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },// 🔑 soft delete 
        });
    }

    async restore(id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, deletedAt: { not: null } },
        });
        if (!product) throw new NotFoundException(`Product with id ${id} not found or not deleted`);

        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: null },
        });
    }
}
