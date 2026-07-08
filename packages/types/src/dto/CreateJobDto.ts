import { JobOptions } from "./JobOptions";

export interface CreateJobDto {
  keyword: string;
  location?: string;
  options: JobOptions;
}
