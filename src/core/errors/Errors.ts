export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NavigationError extends BaseError {}
export class ExtractionError extends BaseError {}
export class ValidationError extends BaseError {}
export class DatabaseError extends BaseError {}
export class QueueError extends BaseError {}
export class BrowserError extends BaseError {}
