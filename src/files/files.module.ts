/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
    imports: [forwardRef(() => AuthModule), CloudinaryModule, PrismaModule],
    controllers: [FilesController],
    providers: [FilesService, FilesRepository],
    exports: [FilesService],
})
export class FilesModule {}
