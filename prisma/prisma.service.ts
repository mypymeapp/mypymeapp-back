import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
        datasources: {
            db: {
            url: process.env.DATABASE_URL,
            },
        },
        // Para Windows + Render
        errorFormat: 'pretty',
        });
    }

    async onModuleInit() {
    let retries = 5;
    while (retries) {
        try {
        await this.$connect();
        console.log('✅ Prisma connected to Render Postgres');
        break;
        } catch (err) {
        retries -= 1;
        console.error(`❌ Prisma failed to connect. Retries left: ${retries}`, err.message);
        await new Promise(res => setTimeout(res, 5000)); // esperar 5s
        }
    }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

