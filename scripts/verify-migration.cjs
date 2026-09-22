const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cek Report yang sekarang punya saldo
  const reportsWithBalance = await prisma.report.findMany({
    where: {
      OR: [
        { initialBalance: { not: null } },
        { finalBalance: { not: null } }
      ]
    },
    select: {
      id: true,
      initialBalance: true,
      finalBalance: true,
      reportDate: true,
    }
  });
  
  console.log('Reports with balance (after migration):', reportsWithBalance.length);
  for (const r of reportsWithBalance) {
    console.log('  Report ' + r.id + ' (' + r.reportDate.toISOString().slice(0, 10) + '): initialBalance=' + r.initialBalance + ', finalBalance=' + r.finalBalance);
  }

  // Konfirmasi tidak ada saldo tersisa di Attachment
  // (kolom sudah di-DROP jadi query ini tidak perlu, tapi kita cek schema)
  console.log('\nVerifikasi Attachment tidak punya field saldo lagi (field sudah di-DROP)...');
  const sample = await prisma.attachment.findFirst();
  if (sample) {
    console.log('Attachment fields:', Object.keys(sample).join(', '));
    const hasBalance = 'initialBalance' in sample;
    console.log('Has initialBalance field:', hasBalance, hasBalance ? 'ERROR!' : 'OK');
  } else {
    console.log('No attachments found to check.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
