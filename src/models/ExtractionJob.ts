export enum JobStatus {
  DISCOVERED = 'DISCOVERED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  EXTRACTED = 'EXTRACTED',
  VALIDATED = 'VALIDATED',
  SAVED = 'SAVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  FAILED_PERMANENT = 'FAILED_PERMANENT'
}

export interface ExtractionJob {
  id: string;
  url: string;
  provider: string;
  keyword: string;
  status: JobStatus;
  attempts: number;
  discoveredAt: Date;
  priority: number;
  lastError?: string;
  data?: any;
}
