import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './mail.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('mail')
export class EmailController {
  constructor(private readonly mailService: EmailService) {}

  @ApiOperation({ summary: 'Send email' })
  @Post('send')
  async sendTestEmail(@Body() body: { to: string; subject: string; text: string }) {
    return this.mailService.sendEmail(body.to, body.subject, body.text);
  }
}




