import { z } from 'zod';
import { JobStatus } from '@lead-platform/types';

export const JobSchema = z.object({
  keyword: z.string().min(1),
  provider: z.string(),
  status: z.nativeEnum(JobStatus).default(JobStatus.Pending),
}).passthrough();

export class JobValidator {
  public static validate(data: any) {
    return JobSchema.parse(data);
  }
}
