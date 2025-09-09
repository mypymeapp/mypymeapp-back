import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRunningMessage(): string {
    return 'MyPymeApp API is running!';
  }
}

