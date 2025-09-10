import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import googleOauthConfig from './utils/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthLib } from './utils/auth.lib';

@Module({
  imports: [
    ConfigModule.forFeature(googleOauthConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    UsersService, 
    JwtService, 
    PrismaService, 
    JwtAuthGuard,
    GoogleStrategy,
    AuthLib
  ],
  exports: [JwtAuthGuard]
})
export class AuthModule {}
