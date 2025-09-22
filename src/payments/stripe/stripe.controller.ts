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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'prisma/prisma.service';

@ApiTags('Payments') // Agrupa en Swagger
@Controller('payments')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private prisma: PrismaService,
  ) {}

  // 🔐 Crea sesión de pago (Checkout) para un usuario autenticado
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Indica que requiere JWT en Swagger
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully.' })
  @ApiResponse({ status: 403, description: 'User without a registered company.' })
  async createCheckoutSession(@Req() req: Request & { user: any }) {
    const { id: userId, companyId } = req.user;
    if (!companyId)
      throw new ForbiddenException('Usuario no tiene empresa registrada');

    return this.stripeService.createCheckoutSession(userId, companyId);
  }

  // 🪝 Webhook que recibe Stripe
  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Webhook de Stripe' })
  @ApiResponse({ status: 200, description: 'Event processed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid signature or rawBody not available.' })
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
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions.' })
  async getUserTransactions(@Param('userId') userId: string) {
    return this.stripeService.getUserTransactions(userId);
  }
}
