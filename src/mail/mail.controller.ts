import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: EmailService) {}

    @Post('send')
    async sendTestEmail(@Body() body: { to: string; subject: string; text: string }) {
        return this.mailService.sendEmail(body.to, body.subject, body.text);
    }
}
