import { Queue } from './Queue';

export class MemoryQueue<T> implements Queue<T> {
  private items: T[] = [];
  private isPaused = false;

  async enqueue(item: T): Promise<void> {
    this.items.push(item);
  }

  async dequeue(): Promise<T | null> {
    if (this.isPaused || this.items.length === 0) return null;
    return this.items.shift() || null;
  }

  async peek(): Promise<T | null> {
    if (this.items.length === 0) return null;
    return this.items[0];
  }

  async pause(): Promise<void> {
    this.isPaused = true;
  }

  async resume(): Promise<void> {
    this.isPaused = false;
  }

  async cancel(): Promise<void> {
    this.items = [];
  }

  async retry(item: T): Promise<void> {
    this.items.unshift(item); // Add to the front
  }

  async size(): Promise<number> {
    return this.items.length;
  }
}
