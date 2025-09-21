/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Injectable, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service';
import { Currency, SubscriptionStatus } from '@prisma/client';
import { EmailService } from '../../mail/mail.service';

// 1. Define una interfaz que extiende Stripe.Invoice
interface InvoiceWithSubscription extends Stripe.Invoice {
    subscription?: string | Stripe.Subscription | null;
}

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService, 
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
            success_url: 'http://localhost:3000/pymes/suscripcion/exito',
            cancel_url: 'http://localhost:3000/pymes/suscripcion/cancelado',
            metadata: { userId, companyId },
            subscription_data: {
                metadata: { userId, companyId },
            },
        });

        // Crear transacción pendiente
        const tx = await this.prisma.transaction.create({
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

        console.log('Transacción creada en checkout:', tx);

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
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            let metadata = session.metadata || {};
            const companyId = metadata.companyId;
            const userId = metadata.userId;

            if (companyId && userId) {
                // Actualizar la transacción inicial de PENDING a SUCCESS
                await this.prisma.transaction.updateMany({
                    where: { providerRef: session.id },
                    data: {
                        status: 'SUCCESS',
                        amount: session.amount_total ?? 0,
                        currency: (session.currency ?? 'USD').toUpperCase() as Currency,
                    },
                });

        // Intentar traer la suscripción y su periodo final
        let subscriptionEndDate: Date | null = null;

        const subscriptionId = (session.subscription as string) || undefined;
        if (subscriptionId) {
            try {
                const subscriptionResponse = await this.stripe.subscriptions.retrieve(subscriptionId);
                const subscription = subscriptionResponse as any; // ⚡ TypeScript hack
                if (subscription.current_period_end) {
                    subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                }
            } catch (err) {
                console.warn(`No se pudo obtener current_period_end de Stripe: ${err}`);
            }
        }

        // Actualizar el estado de la compañía
        await this.prisma.company.update({
            where: { id: companyId },
            data: {
                subscriptionStatus: 'PREMIUM',
                subscriptionEndDate: subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // fallback
            },
        });

        
        console.log(`✅ Compañía ${companyId} marcada como PREMIUM.`);
    }
    break;
}

    case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        let metadata = invoice.metadata || {};

        // Traer metadata desde la suscripción si falta
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
            // Registrar transacción
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
            console.log(`💰 Transacción registrada: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()} para user ${userId}`);

            // Actualizar la compañía con la fecha de fin de suscripción
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

            await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    subscriptionStatus: 'PREMIUM',
                    subscriptionEndDate: subscriptionEndDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
        } else {
            console.warn('⚠️ invoice.paid sin metadata, se ignora');
        }
        break;
    }

        // Opcional: manejar otros eventos de pago único
        case 'payment_intent.succeeded': {
            const pi = event.data.object as Stripe.PaymentIntent;
            // Solo registrar si metadata está presente
            const metadata = pi.metadata || {};
            if (metadata.userId && metadata.companyId) {
                await this.prisma.transaction.updateMany({
                    where: { providerRef: pi.id },
                    data: {
                        status: 'SUCCESS',
                        amount: pi.amount ?? 0,
                        currency: (pi.currency ?? 'USD').toUpperCase() as Currency,
                    },
                });
                console.log(`✅ Transacción actualizada para payment_intent ${pi.id}`);
            } else {
                console.warn('⚠️ payment_intent.succeeded ignorado por metadata faltante');
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
        });
    }
}