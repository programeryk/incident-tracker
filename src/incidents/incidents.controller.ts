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
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiCreatedResponse({ description: 'Incident created successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  create(@Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List incidents with optional filters' })
  @ApiOkResponse({ description: 'Filtered incident list returned.' })
  @ApiBadRequestResponse({ description: 'Query parameters failed validation.' })
  getAll(@Query() query: ListIncidentsQueryDto) {
    return this.incidentsService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single incident with comments' })
  @ApiOkResponse({ description: 'Incident returned successfully.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  getOne(@Param('id') id: string) {
    return this.incidentsService.getOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update incident status and downtime details' })
  @ApiOkResponse({ description: 'Incident updated successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIncidentStatusDto) {
    return this.incidentsService.updateStatus(id, dto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment or update to an incident' })
  @ApiCreatedResponse({ description: 'Comment added successfully.' })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiNotFoundResponse({ description: 'Incident was not found.' })
  addComment(@Param('id') id: string, @Body() dto: CreateIncidentCommentDto) {
    return this.incidentsService.addComment(id, dto);
  }
}
