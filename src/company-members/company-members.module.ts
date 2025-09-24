import { Module } from '@nestjs/common';
import { CompanyMembersService } from './company-members.service';
import { CompanyMembersController } from './company-members.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AuthLib } from 'src/auth/utils/auth.lib';
import { EmailService } from 'src/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [CompanyMembersController],
  providers: [CompanyMembersService, PrismaService, AuthLib, EmailService],
})
export class CompanyMembersModule {}

