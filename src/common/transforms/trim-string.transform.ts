import { Transform } from 'class-transformer';

export function TrimString() {
  return Transform(({ value }) => {
    const rawValue: unknown = value;

    if (typeof rawValue !== 'string') {
      return rawValue;
    }

    return rawValue.trim();
  });
}
