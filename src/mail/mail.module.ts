// import { Module } from '@nestjs/common';
// import { EmailService } from './mail.service';
// import { MailController } from './mail.controller';

// @Module({
//     providers: [EmailService],
//     controllers: [MailController],
//     exports: [EmailService],
// })
// export class MailModule {}

import { Module } from '@nestjs/common';
import { EmailService } from './mail.service';
import { EmailController } from './mail.controller';

@Module({
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class MailModule {}

