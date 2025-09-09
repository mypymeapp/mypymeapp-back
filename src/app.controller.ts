import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Check if the API is running',
    description:
      'Open your browser and navigate to http://localhost:5001/ to see the message.',
  })
  getRunningMessage(): string {
    return this.appService.getRunningMessage();
  }
}

