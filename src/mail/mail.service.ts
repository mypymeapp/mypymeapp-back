// import * as nodemailer from 'nodemailer';
// import { ConfigService } from '@nestjs/config';
// import { Injectable } from '@nestjs/common';
// import { welcomeTemplate } from 'src/templates/welcome.template';
// import { passwordResetTemplate } from 'src/templates/password-reset.template';

// @Injectable()
// export class EmailService {
//   private transporter;

//   constructor(private configService: ConfigService) {
//     this.transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: this.configService.get<string>('GMAIL_USER'),
//         pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
//       },
//     });
//   }

//   async sendEmail(to: string, subject: string, html: string) {
//     const info = await this.transporter.sendMail({
//       from: `"MyPymeApp" <${this.configService.get<string>('GMAIL_USER')}>`,
//       to,
//       subject,
//       html,
//     });

//     return {
//       accepted: info.accepted,
//       rejected: info.rejected,
//       messageId: info.messageId,
//     };
//   }

//   async sendWelcomeEmail(name: string, email: string) {
//     return this.sendEmail(
//       email,
//       '¡Bienvenido a MyPyme!',
//       welcomeTemplate(name),
//     );
//   }

//   async sendPasswordResetEmail(email: string, token: string) {
//     const resetUrl = `${this.configService.get<string>(
//       'FRONTEND_URL',
//     )}/reset-password?token=${token}`;

//     return this.sendEmail(
//       email,
//       'Restablecer contraseña - MyPymeApp',
//       passwordResetTemplate(resetUrl),
//     );
//   }
// }

// ------------------------------------------------------------------------------------------
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { welcomeTemplate } from 'src/templates/welcome.template';
import { passwordResetTemplate } from 'src/templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    // ⚡ Obtengo la API Key y el sender desde .env
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const sender = this.configService.get<string>('SENDGRID_SENDER');

    if (!apiKey || !sender) {
      throw new Error('❌ Faltan variables de entorno: SENDGRID_API_KEY o SENDGRID_SENDER');
    }

    this.senderEmail = sender;
    sgMail.setApiKey(apiKey);
  }

  //  Método genérico para enviar correos
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const msg = {
        to,
        from: this.senderEmail, 
        subject,
        html,
      };

      const [response] = await sgMail.send(msg);

      return {
        status: response.statusCode,
        message: '📧 Email enviado correctamente',
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error.response?.body || error.message);
      throw error;
    }
  }

  //  Email de bienvenida con template
  async sendWelcomeEmail(name: string, email: string) {
    return this.sendEmail(
      email,
      '¡Bienvenido a MyPyme!',
      welcomeTemplate(name), // 👈 template personalizado
    );
  }


  //  Email de restablecimiento de contraseña con template
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${token}`;

    return this.sendEmail(
      email,
      'Restablecer contraseña - MyPymeApp',
      passwordResetTemplate(resetUrl), // 👈 template personalizado
    );
  }
}


