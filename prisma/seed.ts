import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getPeriod(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  return { year, month, weekOfMonth };
}

async function main() {
  const kosasih = await prisma.user.create({
    data: { name: "Bapak Kosasih", role: "Bendahara 2" },
  });
  const cecep = await prisma.user.create({
    data: { name: "Bapak Cecep", role: "Bendahara 1" },
  });

  const reportDates = [
    new Date("2024-10-04"),
    new Date("2024-10-11"),
    new Date("2024-10-18"),
    new Date("2024-10-25"),
  ];

  for (const reportDate of reportDates) {
    const { year, month, weekOfMonth } = getPeriod(reportDate);
    await prisma.report.create({
      data: {
        reportDate,
        photoUrl: "/demo/contoh-laporan.png",
        year,
        month,
        weekOfMonth,
        uploadedById: kosasih.id,
      },
    });
  }

  console.log("Seed data berhasil dibuat:", { kosasih, cecep, jumlahLaporan: reportDates.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });