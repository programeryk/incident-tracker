import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get lightweight service health' })
  @ApiOkResponse({
    description: 'Simple health check endpoint.',
    schema: {
      example: {
        name: 'maintenance-incident-tracker-api',
        status: 'ok',
        timestamp: '2026-04-17T11:30:33.119Z',
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check database readiness' })
  @ApiOkResponse({
    description: 'Service dependencies are ready.',
    schema: {
      example: {
        name: 'maintenance-incident-tracker-api',
        status: 'ready',
        timestamp: '2026-04-17T11:30:33.119Z',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Database connection is unavailable.',
  })
  getReadiness() {
    return this.appService.getReadiness();
  }
}
