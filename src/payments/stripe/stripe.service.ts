/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service';
import { Currency } from '@prisma/client';
import { EmailService } from '../../mail/mail.service';
import { subscriptionInvoiceTemplate } from 'src/templates/subscriptionInvoiceTemplate';
import { subscriptionActivatedTemplate } from 'src/templates/subscriptionActivatedTemplate';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('Falta STRIPE_SECRET_KEY en .env');
    this.stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
  }

  /** Crear sesión de checkout para suscripción PREMIUM */
  async createCheckoutSession(userId: string, companyId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Usuario no encontrado');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: process.env.SUCCESS_URL!,
      cancel_url: process.env.CANCEL_URL!,
      metadata: { userId, companyId },
      subscription_data: {
        metadata: { userId, companyId },
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        companyId,
        type: 'SUBSCRIPTION',
        amount: 0,
        currency: 'USD',
        status: 'PENDING',
        provider: 'STRIPE',
        providerRef: session.id,
      },
    });

    return { url: session.url };
  }

  /** Manejar eventos de Stripe */
  async handleWebhook(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;

    // 1️⃣ Verificar firma Stripe
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
      return { received: true }; // Evitar que Stripe reintente con error 500
    }

    // 2️⃣ Procesar evento de manera segura
    try {
      console.log(`[STRIPE WEBHOOK] Procesando evento: ${event.type}, id: ${event.id}`);

      switch (event.type) {

        /** Checkout completado */
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const metadata = session.metadata || {};
          const companyId = metadata.companyId;
          const userId = metadata.userId;

          if (!companyId || !userId) break; // No hay datos críticos

          // 2a. Actualizar transacción
          await this.prisma.transaction.updateMany({
            where: { providerRef: session.id },
            data: {
              status: 'SUCCESS',
              amount: session.amount_total ?? 0,
              currency: (session.currency ?? 'USD').toUpperCase() as Currency,
            },
          });

          // 2b. Obtener fecha de suscripción desde Stripe
          let subscriptionEndDate: Date | null = null;
          const subscriptionId = (session.subscription as string) || undefined;

          if (subscriptionId) {
            try {
              const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
              if ((subscription as any).current_period_end) {
                subscriptionEndDate = new Date(
                  (subscription as any).current_period_end * 1000
                );
              }
            } catch (err) {
              console.warn('[STRIPE] No se pudo obtener current_period_end:', err);
            }
          }

          // 2c. Actualizar compañía
          const updatedCompany = await this.prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: 'PREMIUM',
              subscriptionEndDate:
                subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          }).catch(err => {
            console.warn(`[PRISMA ERROR] Compañía ${companyId} no encontrada: ${err.message}`);
            return null;
          });

          if (!updatedCompany) break;

          // 2d. Obtener usuario
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          if (!user) break;

          // 2e. Enviar email (aislado)
          try {
            const validUntil = subscriptionEndDate ?? updatedCompany.subscriptionEndDate!;
            await this.emailService.sendEmail(
              user.email,
              '¡Gracias por tu suscripción!',
              subscriptionActivatedTemplate(user.name, updatedCompany.name, validUntil.toLocaleDateString()),
            );
          } catch (emailErr) {
            console.error('[EMAIL ERROR] Activación (Checkout):', emailErr);
          }

          break;
        }

        /** Factura pagada */
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          let metadata = invoice.metadata || {};
          const subscriptionId = (invoice as any).subscription as string | undefined;

          // Intentar metadata de la suscripción si no existe
          if ((!metadata.userId || !metadata.companyId) && subscriptionId) {
            try {
              const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
              metadata = subscription.metadata || {};
            } catch (err) {
              console.warn('[STRIPE] No se pudo obtener metadata de la suscripción:', err);
            }
          }

          const userId = metadata.userId;
          const companyId = metadata.companyId;

          if (!userId || !companyId) break; // Datos críticos faltantes

          // 1. Crear transacción
          await this.prisma.transaction.create({
            data: {
              userId,
              companyId,
              type: 'SUBSCRIPTION',
              amount: invoice.amount_paid,
              currency: invoice.currency.toUpperCase() as Currency,
              status: 'SUCCESS',
              provider: 'STRIPE',
              providerRef: invoice.id,
            },
          });

          // 2. Obtener fecha de suscripción
          let subscriptionEndDate: Date | null = null;
          if (subscriptionId) {
            try {
              const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
              if ((subscription as any).current_period_end) {
                subscriptionEndDate = new Date((subscription as any).current_period_end * 1000);
              }
            } catch (err) {
              console.warn('[STRIPE] No se pudo obtener current_period_end:', err);
            }
          }

          // 3. Actualizar compañía
          const updatedCompany = await this.prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: 'PREMIUM',
              subscriptionEndDate:
                subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          }).catch(err => {
            console.warn(`[PRISMA ERROR] Compañía ${companyId} no encontrada: ${err.message}`);
            return null;
          });

          if (!updatedCompany) break;

          // 4. Obtener usuario
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          if (!user) break;

          // 5. Enviar email de factura (aislado)
          try {
            const validUntil =
              subscriptionEndDate?.toLocaleDateString() ??
              updatedCompany.subscriptionEndDate?.toLocaleDateString() ??
              'N/A';

            await this.emailService.sendEmail(
              user.email,
              'Factura de suscripción pagada',
              subscriptionInvoiceTemplate(
                user.name ?? '',
                invoice.amount_paid / 100,
                invoice.currency,
                validUntil
              ),
            );
          } catch (emailErr) {
            console.error('[EMAIL ERROR] Invoice Paid:', emailErr);
          }

          break;
        }

        default:
          console.log(`[STRIPE] Evento no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      // ❌ Nunca lanzar a Stripe, solo loguear
      console.error('[STRIPE WEBHOOK ERROR] Error procesando evento:', err);
      return { received: true };
    }
  }

  /** Obtener transacciones de un usuario */
  async getUserTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}
