import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DatabaseService);

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';

  console.log(`Seeding Admin User: ${email}`);

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Admin user already exists.');
    await app.close();
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  await db.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created successfully.');
  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
