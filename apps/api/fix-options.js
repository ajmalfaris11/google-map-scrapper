const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const job = await prisma.job.findFirst({ where: { status: 'QUEUED' } });
  console.log(job);
  if (job && job.options && job.options.concurrency) {
    const opts = job.options;
    opts.concurrency = 2;
    await prisma.job.update({ where: { id: job.id }, data: { options: opts } });
    console.log("Updated concurrency to 2");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
