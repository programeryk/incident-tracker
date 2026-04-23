import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

export function BooleanQuery() {
  return Transform(({ value }) => {
    const rawValue: unknown = value;

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return undefined;
    }

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.trim().toLowerCase();

      if (['true', '1'].includes(normalized)) {
        return true;
      }

      if (['false', '0'].includes(normalized)) {
        return false;
      }
    }

    throw new BadRequestException('Boolean query value must be true or false.');
  });
}
