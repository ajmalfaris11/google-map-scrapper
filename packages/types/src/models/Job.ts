export enum JobStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Paused = 'PAUSED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export interface JobModel {
  id?: string;
  keyword: string;
  provider: string;
  status: JobStatus;
  progress: number;
  totalFound: number;
  processed: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
