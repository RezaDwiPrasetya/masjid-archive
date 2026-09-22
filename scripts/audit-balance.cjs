const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const withBalance = await prisma.attachment.findMany({
    where: {
      OR: [
        { initialBalance: { not: null } },
        { finalBalance: { not: null } }
      ]
    },
  });
  
  console.log('Attachments with balance:', withBalance.length);
  
  if (withBalance.length === 0) {
    console.log('No balance data found — migration will be clean (no data to move).');
    return;
  }

  const conflicts = {};
  for (const att of withBalance) {
    const rId = att.reportId;
    if (!conflicts[rId]) conflicts[rId] = [];
    conflicts[rId].push({ 
      attachmentId: att.id, 
      initialBalance: att.initialBalance ? att.initialBalance.toString() : null, 
      finalBalance: att.finalBalance ? att.finalBalance.toString() : null 
    });
  }
  
  console.log('\nPer-report breakdown:');
  for (const [reportId, atts] of Object.entries(conflicts)) {
    const hasConflict = atts.length > 1;
    console.log('  Report ' + reportId + ': ' + atts.length + ' attachment(s) with balance ' + (hasConflict ? 'CONFLICT' : 'OK'));
    for (const a of atts) {
      console.log('    - Attachment ' + a.attachmentId + ': initialBalance=' + a.initialBalance + ', finalBalance=' + a.finalBalance);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
