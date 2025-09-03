/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
    providers: [CloudinaryProvider],
    exports: [CloudinaryProvider], // <- importante para poder usarlo en otros módulos
})
export class CloudinaryModule {}