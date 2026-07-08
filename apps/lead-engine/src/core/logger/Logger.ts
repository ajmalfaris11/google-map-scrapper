import pino from 'pino';
import { env } from '@lead-platform/config';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino({
  level: env.LOG_LEVEL,
}, pino.transport({
  targets: [
    {
      target: 'pino-pretty', // Log to stdout with pretty print
      options: {
        colorize: true,
      },
      level: env.LOG_LEVEL
    },
    {
      target: 'pino-roll',
      options: {
        file: path.join(logDir, 'scraper'),
        frequency: 'daily',
        extension: '.log',
        mkdir: true,
      },
      level: env.LOG_LEVEL
    }
  ]
}));
