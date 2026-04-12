import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'maintenance-incident-tracker-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
