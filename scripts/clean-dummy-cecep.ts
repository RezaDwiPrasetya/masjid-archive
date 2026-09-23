import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Memeriksa Pengguna Dummy ===");

  const cecep = await prisma.user.findFirst({
    where: { name: "Bapak Cecep" },
    include: {
      _count: {
        select: {
          reports: true,
          verifiedTransactions: true,
        },
      },
    },
  });

  if (!cecep) {
    console.log("Akun 'Bapak Cecep' tidak ditemukan atau sudah dibersihkan.");
  } else {
    console.log(`Ditemukan: ${cecep.name} (ID: ${cecep.id})`);
    console.log(`Riwayat: ${cecep._count.reports} laporan, ${cecep._count.verifiedTransactions} verifikasi.`);

    if (cecep._count.reports === 0 && cecep._count.verifiedTransactions === 0) {
      await prisma.user.delete({
        where: { id: cecep.id },
      });
      console.log("✓ Akun 'Bapak Cecep' berhasil dihapus permanen (aman, tanpa jejak audit).");
    } else {
      console.log("✗ Dibatalkan: Akun memiliki jejak audit.");
    }
  }

  // Verifikasi proteksi Bapak Kosasih
  const kosasih = await prisma.user.findFirst({
    where: { name: "Bapak Kosasih" },
    include: {
      _count: {
        select: {
          reports: true,
          verifiedTransactions: true,
        },
      },
    },
  });

  if (kosasih) {
    console.log(`\nVerifikasi status 'Bapak Kosasih':`);
    console.log(`ID: ${kosasih.id}, Role: ${kosasih.role}`);
    console.log(`Riwayat: ${kosasih._count.reports} laporan, ${kosasih._count.verifiedTransactions} verifikasi.`);
    console.log(`✓ Terproteksi: Memiliki ${kosasih._count.reports} laporan sehingga tidak boleh dihapus.`);
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("\nDaftar Pengguna Saat Ini:", remainingUsers);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
