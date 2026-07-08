export interface JobOptions {
  category: string;
  location: string;
  maxResults?: number;
  headless?: boolean;
  concurrency?: number;
}
