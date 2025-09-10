import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateStockDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });

        if (!product) throw new NotFoundException('Producto no encontrado');

        let newQty = product.qty;

        if (dto.type === StockMovementType.IN) {
            newQty += dto.qty;
        } else if (dto.type === StockMovementType.OUT) {
            if (product.qty < dto.qty) {
                throw new BadRequestException('Stock insuficiente');
            }
            newQty -= dto.qty;
        } else if (dto.type === StockMovementType.ADJUSTMENT) {
            newQty = dto.qty; // se fija el stock
        }

        // Actualizar stock en producto
        await this.prisma.product.update({
            where: { id: dto.productId },
            data: { qty: newQty },
        });

        // Registrar movimiento
        return this.prisma.stockMovements.create({
            data: {
                ...dto,
                qty: dto.qty,
            },
        });
    }

    async findAll(companyId: string) {
        return this.prisma.stockMovements.findMany({
            where: { companyId },
            include: { Product: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByProduct(productId: string) {
        return this.prisma.stockMovements.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
