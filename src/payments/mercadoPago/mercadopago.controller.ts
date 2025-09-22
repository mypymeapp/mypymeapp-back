// import { Controller, Get } from '@nestjs/common';
// import { MercadoPagoService } from '../mercadoPago/mercadopago.service';

// @Controller('mp-test')
// export class MercadoPagoTestController {
//   constructor(private mpService: MercadoPagoService) {}

//   @Get()
//   async testPreference() {
//     const response = await this.mpService.createPreference({
//       title: 'Producto de prueba',
//       quantity: 1,
//       unit_price: 100,
//       payer_email: 'test_user_123456@testuser.com',
//       currency_id: 'UYU',
//     });

//     return response; // aquí verás init_point y sandbox_init_point
//   }
// }

