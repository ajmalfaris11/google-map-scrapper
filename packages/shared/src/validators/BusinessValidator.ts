import { z } from 'zod';

export const BusinessSchema = z.object({
  provider: z.string(),
  keyword: z.string(),
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal('')),
  status: z.string().default('ACTIVE'),
}).passthrough();

export class BusinessValidator {
  public static validate(data: any) {
    return BusinessSchema.parse(data);
  }
}
