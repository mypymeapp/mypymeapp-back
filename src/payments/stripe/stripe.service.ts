/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service';
import { Currency, SubscriptionStatus } from '@prisma/client';
import { EmailService } from '../../mail/mail.service';

// 1. Extiende Stripe.Invoice
interface InvoiceWithSubscription extends Stripe.Invoice {
    subscription?: string | Stripe.Subscription | null;
}

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
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

        try {
        event = this.stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        } catch (err: any) {
        console.error('Error construyendo evento Stripe:', err.message);
        throw new Error(`Webhook signature verification failed: ${err.message}`);
        }

        try {
        switch (event.type) {
            /** Checkout completado */
            case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};
            const companyId = metadata.companyId;
            const userId = metadata.userId;

            if (companyId && userId) {
                await this.prisma.transaction.updateMany({
                where: { providerRef: session.id },
                data: {
                    status: 'SUCCESS',
                    amount: session.amount_total ?? 0,
                    currency: (session.currency ?? 'USD').toUpperCase() as Currency,
                },
                });

                let subscriptionEndDate: Date | null = null;
                const subscriptionId = (session.subscription as string) || undefined;
                if (subscriptionId) {
                try {
                    const subscriptionResponse = await this.stripe.subscriptions.retrieve(subscriptionId);
                    const subscription = subscriptionResponse as any;
                    if (subscription.current_period_end) {
                    subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                    }
                } catch (err) {
                    console.warn(`No se pudo obtener current_period_end de Stripe: ${err}`);
                }
                }

                const updatedCompany = await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    subscriptionStatus: 'PREMIUM',
                    subscriptionEndDate: subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                });

                const user = await this.prisma.user.findUnique({ where: { id: userId } });
                if (!user) throw new Error(`Usuario con id ${userId} no encontrado`);

                const validUntil = (subscriptionEndDate ?? updatedCompany.subscriptionEndDate)!;

                await this.emailService.sendEmail(
                user.email,
                '¡Gracias por tu suscripción!',
                `<p>Hola ${user.name},</p>
                <p>Tu suscripción PREMIUM fue activada con éxito para la compañía ${updatedCompany.name}.</p>
                <p>Válida hasta: ${validUntil.toLocaleDateString()}.</p>`
                );
            }
            break;
            }

            /** Factura pagada */
            case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            let metadata = invoice.metadata || {};

            const subscriptionId = (invoice as any).subscription as string | undefined;
            if ((!metadata.userId || !metadata.companyId) && subscriptionId) {
                try {
                const subscriptionResponse = await this.stripe.subscriptions.retrieve(subscriptionId);
                const subscription = subscriptionResponse as any;
                metadata = subscription.metadata || {};
                } catch (err) {
                console.warn(`No se pudo obtener metadata desde la suscripción: ${err}`);
                }
            }

            const userId = metadata.userId;
            const companyId = metadata.companyId;

            if (userId && companyId) {
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

                let subscriptionEndDate: Date | null = null;
                if (subscriptionId) {
                try {
                    const subscriptionResponse = await this.stripe.subscriptions.retrieve(subscriptionId);
                    const subscription = subscriptionResponse as any;
                    if (subscription.current_period_end) {
                    subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                    }
                } catch (err) {
                    console.warn(`No se pudo obtener current_period_end de Stripe: ${err}`);
                }
                }

                const updatedCompany = await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    subscriptionStatus: 'PREMIUM',
                    subscriptionEndDate: subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                });

                const user = await this.prisma.user.findUnique({ where: { id: userId } });

                if (user) {
                const validUntil =
                    subscriptionEndDate?.toLocaleDateString() ??
                    updatedCompany.subscriptionEndDate?.toLocaleDateString() ??
                    'N/A';

                await this.emailService.sendEmail(
                    user.email,
                    'Factura de suscripción pagada',
                    `<p>Hola ${user.name ?? ''},</p>
                    <p>Tu pago de suscripción PREMIUM se registró correctamente.</p>
                    <p>Monto: ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}.</p>
                    <p>Válida hasta: ${validUntil}.</p>`
                );
                }
            }
            break;
            }

            default:
            console.log(`Evento no manejado: ${event.type}`);
        }

        return { received: true };
        } catch (err) {
        console.error('Error procesando webhook:', err);
        throw new Error('Error procesando webhook');
        }
    }

    /** Obtener transacciones de un usuario */
    async getUserTransactions(userId: string) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                    name: true,
                    email: true,
                    },
                },
            },
        });
    }
}
