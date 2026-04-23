import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'incident_tracker_http_requests_total',
    help: 'Total HTTP requests.',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });
  private readonly httpDuration = new Histogram({
    name: 'incident_tracker_http_request_duration_seconds',
    help: 'HTTP request duration in seconds.',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });
  private readonly incidentEvents = new Counter({
    name: 'incident_tracker_incident_events_total',
    help: 'Incident event records created.',
    labelNames: ['type'],
    registers: [this.registry],
  });
  private readonly queueJobs = new Counter({
    name: 'incident_tracker_queue_jobs_total',
    help: 'Background queue jobs processed.',
    labelNames: ['name', 'status'],
    registers: [this.registry],
  });
  private readonly dbReady = new Gauge({
    name: 'incident_tracker_database_ready',
    help: 'Database readiness, 1 ready and 0 unavailable.',
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  recordHttp(
    method: string,
    route: string,
    status: number,
    durationMs: number,
  ) {
    const labels = {
      method,
      route,
      status: String(status),
    };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationMs / 1000);
  }

  recordIncidentEvent(type: string) {
    this.incidentEvents.inc({ type });
  }

  recordQueueJob(name: string, status: 'completed' | 'failed' | 'queued') {
    this.queueJobs.inc({ name, status });
  }

  setDatabaseReady(ready: boolean) {
    this.dbReady.set(ready ? 1 : 0);
  }

  contentType() {
    return this.registry.contentType;
  }

  metrics() {
    return this.registry.metrics();
  }
}
