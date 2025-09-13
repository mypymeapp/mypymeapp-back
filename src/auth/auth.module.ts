import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthLib } from './utils/auth.lib';
import { EmailService } from 'src/mail/mail.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    AuthService, 
    UsersService, 
    JwtService, 
    PrismaService, 
    JwtAuthGuard,
    AuthLib, 
    EmailService
  ],
  exports: [JwtAuthGuard]
})
export class AuthModule {}
