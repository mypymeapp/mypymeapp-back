import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
    imports: [CloudinaryModule, PrismaModule],
    controllers: [FilesController],
    providers: [FilesService, FilesRepository],
    exports: [FilesService],
})
export class FilesModule {}
