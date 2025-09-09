import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesRepository {
    constructor(private prisma: PrismaService) {}

    async saveFile(data: { name: string; mimeType: string; url: string; productId?: string }) {
        return await this.prisma.file.create({
            data: {
                name: data.name,
                mimeType: data.mimeType,
                url: data.url,
            },
        });
    }

}
