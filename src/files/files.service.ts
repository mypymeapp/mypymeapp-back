import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import toStream from 'buffer-to-stream';
import { FilesRepository } from './files.repository';
import { PrismaService } from 'prisma/prisma.service';
// import { ProductsRepository } from '../products/products.repository';

@Injectable()
export class FilesService {
    constructor(
        private readonly filesRepo: FilesRepository,
        private readonly prisma: PrismaService, // para actualizar user y company
    ) {}

    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { resource_type: 'auto' },
                (error, result) => {
                    if (error) return reject(error);
                    if (result) resolve(result);
                    else reject(new Error('Cloudinary upload failed'));
                },
            );
            toStream(file.buffer).pipe(upload);
        });
    }

    async uploadProductImage(productId: string, file: Express.Multer.File) {
        const uploadResult = await this.uploadImage(file);

        // actualizamos producto con el fileId
        const savedFile = await this.filesRepo.saveFile({
            name: file.originalname,
            mimeType: file.mimetype,
            url: uploadResult.secure_url,
            productId,
        });

        await this.prisma.productImage.create({
            data: {
            product: { connect: { id: productId } },
            file: { connect: { id: savedFile.id } },
            },
        });

        return {
            imageUrl: uploadResult.secure_url,
            fileId: savedFile.id,
        };
    }

    async uploadUserAvatar(userId: string, file: Express.Multer.File) {
        const uploadResult = await this.uploadImage(file);

        const savedFile = await this.filesRepo.saveFile({
            name: file.originalname,
            mimeType: file.mimetype,
            url: uploadResult.secure_url,
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: uploadResult.secure_url },
        });

        return {
            avatarUrl: uploadResult.secure_url,
            fileId: savedFile.id,
        };
    }

    async uploadCompanyLogo(companyId: string, file: Express.Multer.File) {
        const uploadResult = await this.uploadImage(file);

        const savedFile = await this.filesRepo.saveFile({
            name: file.originalname,
            mimeType: file.mimetype,
            url: uploadResult.secure_url,
        });

        await this.prisma.company.update({
            where: { id: companyId },
            data: { logoFileId: savedFile.id },
        });

        return {
            logoUrl: uploadResult.secure_url,
            fileId: savedFile.id,
        };
    }
}

