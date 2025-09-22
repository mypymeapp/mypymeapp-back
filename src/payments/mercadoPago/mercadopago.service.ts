// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { MercadoPagoConfig, Preference } from 'mercadopago';

// @Injectable()
// export class MercadoPagoService {
//   private preference: Preference;

//   constructor(private configService: ConfigService) {
//     // Inicializas el cliente con tus credenciales
//     const client = new MercadoPagoConfig({
//       accessToken: this.configService.get<string>('MP_ACCESS_TOKEN') ?? '',
//     });

//     // Creamos la instancia del recurso que vamos a usar (en este caso Preferences)
//     this.preference = new Preference(client);
//   }

//   async createPreference(data: {
//     title: string;
//     quantity: number;
//     unit_price: number;
//     payer_email: string;
//     currency_id?: 'ARS' | 'UYU';
//   }) {
//     const preferenceData = {
//       items: [
//         {
//           title: data.title,
//           quantity: data.quantity,
//           unit_price: data.unit_price,
//           currency_id: data.currency_id || 'UYU',
//         },
//       ],
//       payer: {
//         email: data.payer_email,
//       },
//       back_urls: {
//         success: 'https://tuweb.com/pago-exitoso',
//         failure: 'https://tuweb.com/pago-fallido',
//         pending: 'https://tuweb.com/pago-pendiente',
//       },
//       auto_return: 'approved',
//     };

//     // En la nueva versión se llama así:
//     const response = await this.preference.create({
//       body: preferenceData as any,
//     });

//     return response; // trae init_point y demás
//   }
// }

