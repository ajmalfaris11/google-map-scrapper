const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.job.updateMany({
    where: { status: 'RUNNING' },
    data: { status: 'QUEUED', progress: 0 }
  });
  console.log(`Reset ${result.count} jobs`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
