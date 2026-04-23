import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateMachineDto } from './dto/create-machine.dto';
import { ListMachinesQueryDto } from './dto/list-machines-query.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { MachinesService } from './machines.service';

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  list(@Query() query: ListMachinesQueryDto) {
    return this.machinesService.list(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.machinesService.getOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  create(@Body() dto: CreateMachineDto, @CurrentUser() actor: AuthUser) {
    return this.machinesService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMachineDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.machinesService.update(id, dto, actor);
  }
}
