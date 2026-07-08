export interface Queue<T> {
  enqueue(item: T): Promise<void>;
  dequeue(): Promise<T | null>;
  peek(): Promise<T | null>;
  size(): Promise<number>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isPaused(): Promise<boolean>;
}
