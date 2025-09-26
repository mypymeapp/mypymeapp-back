import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { welcomeTemplate } from 'src/templates/welcome.template';
import { passwordResetTemplate } from 'src/templates/password-reset.template';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Usar SSL para el puerto 465
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"MyPymeApp" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject,
      html,
    });

    return {
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
    };
  }

  async sendWelcomeEmail(name: string, email: string) {
    return this.sendEmail(
      email,
      '¡Bienvenido a MyPyme!',
      welcomeTemplate(name),
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${token}`;

    return this.sendEmail(
      email,
      'Restablecer contraseña - MyPymeApp',
      passwordResetTemplate(resetUrl),
    );
  }
}

