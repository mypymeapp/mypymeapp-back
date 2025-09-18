import { Module } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoTestController } from './mercadopago.controller';

@Module({
  controllers: [MercadoPagoTestController],
  providers: [MercadoPagoService],
})
export class MercadoPagoModule {}

