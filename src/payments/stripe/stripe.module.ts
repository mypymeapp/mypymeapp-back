import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../mail/mail.service';


@Module({
    controllers: [StripeController],
    providers: [StripeService, PrismaService, JwtService, EmailService],
})
export class StripeModule {}
