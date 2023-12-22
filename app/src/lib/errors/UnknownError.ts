import { ApplicationError } from './ApplicationError';

export class UnknownError extends ApplicationError {
  constructor() {
    super('An unknown error has occurred.');
  }
}
