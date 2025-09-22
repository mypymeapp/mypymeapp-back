import {
  Controller,
  Post,
  Get,
  Req,
  Headers,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'prisma/prisma.service';

@Controller('payments')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private prisma: PrismaService,
  ) {}

  // 🔐 Crea sesión de pago (Checkout) para un usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Req() req: Request & { user: any }) {
    const { id: userId, companyId } = req.user;
    if (!companyId)
      throw new ForbiddenException('Usuario no tiene empresa registrada');

    return this.stripeService.createCheckoutSession(userId, companyId);
  }

  // 🪝 Webhook que recibe Stripe
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Req() req: Request,           
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = req.body;
    if (!rawBody) throw new Error('rawBody no disponible');

    return this.stripeService.handleWebhook(rawBody, sig);
  }

  // 👀 Devuelve todas las transacciones de un usuario
  @Get(':userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.stripeService.getUserTransactions(userId);
  }
}
