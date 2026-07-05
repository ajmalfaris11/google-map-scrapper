import { Queue } from './Queue';

export class MemoryQueue<T> implements Queue<T> {
  private items: T[] = [];
  private paused: boolean = false;

  async enqueue(item: T): Promise<void> {
    this.items.push(item);
  }

  async dequeue(): Promise<T | null> {
    if (this.paused) return null;
    return this.items.shift() || null;
  }

  async peek(): Promise<T | null> {
    return this.items[0] || null;
  }

  async size(): Promise<number> {
    return this.items.length;
  }
  
  async pause(): Promise<void> {
    this.paused = true;
  }
  
  async resume(): Promise<void> {
    this.paused = false;
  }
  
  async isPaused(): Promise<boolean> {
    return this.paused;
  }
}
