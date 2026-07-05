import { env } from './env.validator';

export class ConfigService {
  public static get(key: keyof typeof env) {
    return env[key];
  }
}
