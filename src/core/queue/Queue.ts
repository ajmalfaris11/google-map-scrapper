export interface Queue<T> {
  enqueue(item: T): Promise<void>;
  dequeue(): Promise<T | null>;
  peek(): Promise<T | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(): Promise<void>;
  retry(item: T): Promise<void>;
  size(): Promise<number>;
}
