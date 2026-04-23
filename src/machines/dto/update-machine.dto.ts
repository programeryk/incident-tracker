import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMachineDto } from './create-machine.dto';

export class UpdateMachineDto extends PartialType(
  OmitType(CreateMachineDto, ['code'] as const),
) {}
