import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
    UserRole.SUPERVISOR,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiCreatedResponse({ description: 'Incident created successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  create(@Body() dto: CreateIncidentDto, @CurrentUser() actor: AuthUser) {
    return this.incidentsService.create(dto, actor);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get incident dashboard metrics' })
  @ApiOkResponse({ description: 'Incident dashboard metrics returned.' })
  getMetrics() {
    return this.incidentsService.getMetrics();
  }

  @Get()
  @ApiOperation({
    summary: 'List incidents with optional filters and pagination',
  })
  @ApiOkResponse({
    description: 'Paginated incident list returned.',
    schema: {
      example: {
        data: [
          {
            id: 'clxincident001',
            title: 'Hydraulic leak on press 04',
            machineId: 'PRESS-04',
            status: 'OPEN',
            priority: 'HIGH',
            occurredAt: '2026-04-11T14:30:00.000Z',
            acknowledgedAt: null,
            resolvedAt: null,
            downtimeMinutes: null,
            comments: [],
          },
        ],
        meta: {
          page: 1,
          pageSize: 20,
          itemCount: 57,
          pageCount: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Query parameters failed validation.' })
  getAll(@Query() query: ListIncidentsQueryDto) {
    return this.incidentsService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single incident with comments' })
  @ApiOkResponse({ description: 'Incident returned successfully.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  getOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.incidentsService.getOne(id, actor);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get the immutable incident timeline' })
  @ApiOkResponse({ description: 'Incident timeline returned successfully.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  getEvents(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.incidentsService.getEvents(id, actor);
  }

  @Patch(':id/status')
  @Roles(UserRole.TECHNICIAN, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update incident status and downtime details' })
  @ApiOkResponse({ description: 'Incident updated successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.incidentsService.updateStatus(id, dto, actor);
  }

  @Post(':id/comments')
  @Roles(
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
    UserRole.SUPERVISOR,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Add a comment or update to an incident' })
  @ApiCreatedResponse({ description: 'Comment added successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateIncidentCommentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.incidentsService.addComment(id, dto, actor);
  }
}
