import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Upload product image to Cloudinary' })
  @ApiBearerAuth()
  @Post('uploadImage/:id')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 200_000 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.filesService.uploadProductImage(id, file);
    return {
      message: 'Imagen subida correctamente',
      ...result,
    };
  }

  @ApiOperation({ summary: 'Upload user avatar to cloudinary' })
  @ApiBearerAuth()
  @Post('uploadAvatar/:userId')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @Param('userId', ParseUUIDPipe) userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 200_000 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.filesService.uploadUserAvatar(userId, file);
    return {
      message: 'Avatar subido correctamente',
      ...result,
    };
  }
}

