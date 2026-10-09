import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { MonthlyReportExportData, WeeklyReportExportData, YearlyReportExportData } from "./export-excel";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(num: number): string {
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal);
  return `${isNegative ? "- " : ""}Rp ${formatted}`;
}

function truncateText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string {
  if (!text) return "-";
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "...", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.trim() + "...";
}

/**
 * Generate native vector A4 PDF for Monthly Report
 */
export async function generateMonthlyReportPdf(data: MonthlyReportExportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Colors
  const cBlack = rgb(0.1, 0.1, 0.1);
  const cMuted = rgb(0.4, 0.4, 0.4);
  const cLightBg = rgb(0.95, 0.96, 0.95);
  const cBorder = rgb(0.78, 0.8, 0.78);
  const cGreen = rgb(0.02, 0.45, 0.32);
  const cRed = rgb(0.75, 0.1, 0.2);

  // A4 dimensions in points: 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // 523.28

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 36;

  const monthName = MONTH_NAMES[data.month - 1] || `Bulan ${data.month}`;
  const periodTitle = `${monthName} ${data.year}`;

  // 1. KOP SURAT
  const dkmTitle = "DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN";
  const dkmTitleWidth = fontBold.widthOfTextAtSize(dkmTitle, 13);
  page.drawText(dkmTitle, {
    x: (pageWidth - dkmTitleWidth) / 2,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.04, 0.38, 0.25),
  });
  y -= 14;

  const dkmAddress = "Jl. Mayjen Sutoyo, Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang - Jawa Barat";
  const dkmAddressWidth = fontRegular.widthOfTextAtSize(dkmAddress, 8);
  page.drawText(dkmAddress, {
    x: (pageWidth - dkmAddressWidth) / 2,
    y,
    size: 8,
    font: fontRegular,
    color: cMuted,
  });
  y -= 8;

  // Garis Kop Ganda
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.5,
    color: cBlack,
  });
  y -= 2;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: cBlack,
  });
  y -= 14;

  // 2. JUDUL
  const docTitle = "REKAPITULASI PEMBUKUAN KAS BULANAN";
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 11);
  page.drawText(docTitle, {
    x: (pageWidth - docTitleWidth) / 2,
    y,
    size: 11,
    font: fontBold,
    color: cBlack,
  });
  y -= 12;

  const docSubtitle = `Periode: ${periodTitle}`;
  const docSubtitleWidth = fontRegular.widthOfTextAtSize(docSubtitle, 8.5);
  page.drawText(docSubtitle, {
    x: (pageWidth - docSubtitleWidth) / 2,
    y,
    size: 8.5,
    font: fontRegular,
    color: cMuted,
  });
  y -= 16;

  // 3. KARTU RINGKASAN SALDO (4 Kotak)
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 36;
  const cards = [
    { label: "Saldo Awal Bulan:", val: formatRupiah(data.initialBalance), color: cBlack, bg: cLightBg },
    { label: "Total Pemasukan:", val: `+ ${formatRupiah(data.totalIncome)}`, color: cGreen, bg: cLightBg },
    { label: "Total Pengeluaran:", val: `- ${formatRupiah(data.totalExpense)}`, color: cRed, bg: cLightBg },
    { label: "Saldo Akhir Bulan:", val: formatRupiah(data.finalBalance), color: cBlack, bg: rgb(0.9, 0.93, 0.9) },
  ];

  cards.forEach((c, idx) => {
    const cx = marginX + idx * (cardWidth + 3);
    page.drawRectangle({
      x: cx,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: c.bg,
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    page.drawText(c.label, {
      x: cx + 5,
      y: y - 11,
      size: 7,
      font: fontRegular,
      color: cMuted,
    });
    page.drawText(c.val, {
      x: cx + 5,
      y: y - 26,
      size: 8.5,
      font: fontBold,
      color: c.color,
    });
  });
  y -= cardHeight + 12;

  // 4. TABEL MUTASI TRANSAKSI
  const cols = [
    { key: "no", title: "No", w: 22, align: "center" },
    { key: "date", title: "Tanggal", w: 54, align: "left" },
    { key: "desc", title: "Uraian / Keterangan", w: 165, align: "left" },
    { key: "donor", title: "Sumber / Donatur", w: 98, align: "left" },
    { key: "in", title: "Pemasukan", w: 60, align: "right" },
    { key: "out", title: "Pengeluaran", w: 60, align: "right" },
    { key: "bal", title: "Saldo Kas", w: 64.28, align: "right" },
  ];

  const drawTableHeader = (p: PDFPage, currentY: number) => {
    p.drawRectangle({
      x: marginX,
      y: currentY - 14,
      width: contentWidth,
      height: 14,
      color: rgb(0.88, 0.91, 0.88),
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    let curX = marginX;
    cols.forEach((col) => {
      let tx = curX + 3;
      if (col.align === "center") {
        tx = curX + (col.w - fontBold.widthOfTextAtSize(col.title, 7)) / 2;
      } else if (col.align === "right") {
        tx = curX + col.w - fontBold.widthOfTextAtSize(col.title, 7) - 3;
      }
      p.drawText(col.title, {
        x: tx,
        y: currentY - 10,
        size: 7,
        font: fontBold,
        color: cBlack,
      });
      curX += col.w;
    });
    return currentY - 14;
  };

  y = drawTableHeader(page, y);

  // Baris Saldo Awal
  let runningBalance = data.initialBalance;
  const drawRowBorder = (p: PDFPage, ry: number) => {
    p.drawLine({
      start: { x: marginX, y: ry },
      end: { x: pageWidth - marginX, y: ry },
      thickness: 0.5,
      color: cBorder,
    });
  };

  const rowHeight = 13.5;

  // Render Saldo Awal
  page.drawRectangle({
    x: marginX,
    y: y - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: rgb(0.98, 0.98, 0.98),
  });
  page.drawText("-", { x: marginX + 9, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText("-", { x: marginX + 26, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText(`Saldo Awal per 1 ${periodTitle}`, {
    x: marginX + 22 + 54 + 4,
    y: y - 10,
    size: 7,
    font: fontItalic,
    color: cMuted,
  });
  page.drawText("-", { x: marginX + 22 + 54 + 165 + 98 + 60 - 10, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText("-", { x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - 10, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  const initBalStr = formatRupiah(runningBalance);
  page.drawText(initBalStr, {
    x: pageWidth - marginX - fontBold.widthOfTextAtSize(initBalStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cBlack,
  });
  drawRowBorder(page, y - rowHeight);
  y -= rowHeight;

  // Render Transaksi
  for (let i = 0; i < data.transactions.length; i++) {
    const tx = data.transactions[i];
    const isIncome = tx.type === "pemasukan";
    if (isIncome) {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    // Cek apakah halaman masih muat (sisakan 80pt untuk tanda tangan)
    if (y - rowHeight < 80) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 36;
      y = drawTableHeader(page, y);
    }

    const txDateStr = tx.transactionDate
      ? new Date(tx.transactionDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

    const descTrunc = truncateText(tx.description || "-", 158, fontRegular, 6.8);
    const donorTrunc = truncateText(tx.donorNameCanonical || tx.donorNameRaw || (isIncome ? "Infaq Anonim / Kotak Amal" : "-"), 92, fontRegular, 6.8);

    // No
    page.drawText(String(i + 1), {
      x: marginX + (22 - fontRegular.widthOfTextAtSize(String(i + 1), 6.8)) / 2,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    // Tanggal
    page.drawText(txDateStr, {
      x: marginX + 22 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cMuted,
    });

    // Uraian
    page.drawText(descTrunc, {
      x: marginX + 22 + 54 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    // Sumber
    page.drawText(donorTrunc, {
      x: marginX + 22 + 54 + 165 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cMuted,
    });

    // Pemasukan (Green)
    const incStr = isIncome ? formatRupiah(tx.amount) : "-";
    page.drawText(incStr, {
      x: marginX + 22 + 54 + 165 + 98 + 60 - fontBold.widthOfTextAtSize(incStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontBold,
      color: isIncome ? cGreen : cMuted,
    });

    // Pengeluaran (Red)
    const expStr = !isIncome ? formatRupiah(tx.amount) : "-";
    page.drawText(expStr, {
      x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - fontBold.widthOfTextAtSize(expStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontBold,
      color: !isIncome ? cRed : cMuted,
    });

    // Saldo
    const balStr = formatRupiah(runningBalance);
    page.drawText(balStr, {
      x: pageWidth - marginX - fontRegular.widthOfTextAtSize(balStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    drawRowBorder(page, y - rowHeight);
    y -= rowHeight;
  }

  // Footer Total Mutasi
  if (y - 16 < 80) {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 36;
  }

  page.drawRectangle({
    x: marginX,
    y: y - 15,
    width: contentWidth,
    height: 15,
    color: rgb(0.92, 0.94, 0.92),
    borderColor: cBlack,
    borderWidth: 0.5,
  });

  const footerLabel = "TOTAL MUTASI BULAN INI";
  page.drawText(footerLabel, {
    x: marginX + (22 + 54 + 165 + 98 - fontBold.widthOfTextAtSize(footerLabel, 7.5)) / 2,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cBlack,
  });

  const totIncStr = formatRupiah(data.totalIncome);
  page.drawText(totIncStr, {
    x: marginX + 22 + 54 + 165 + 98 + 60 - fontBold.widthOfTextAtSize(totIncStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cGreen,
  });

  const totExpStr = formatRupiah(data.totalExpense);
  page.drawText(totExpStr, {
    x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - fontBold.widthOfTextAtSize(totExpStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cRed,
  });

  const totFinStr = formatRupiah(data.finalBalance);
  page.drawText(totFinStr, {
    x: pageWidth - marginX - fontBold.widthOfTextAtSize(totFinStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cBlack,
  });
  y -= 25;

  // 5. PENGESAHAN TANDA TANGAN
  if (y < 70) {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 36;
  }

  const signDateStr = `Subang, Akhir ${periodTitle}`;
  const signDateWidth = fontRegular.widthOfTextAtSize(signDateStr, 7.5);
  page.drawText(signDateStr, {
    x: pageWidth - marginX - signDateWidth,
    y,
    size: 7.5,
    font: fontRegular,
    color: cBlack,
  });
  y -= 14;

  const colSignWidth = contentWidth / 2;
  const leftX = marginX + (colSignWidth - 140) / 2;
  const rightX = marginX + colSignWidth + (colSignWidth - 140) / 2;

  // Mengetahui
  page.drawText("Mengetahui,", { x: leftX + 40, y, size: 7.5, font: fontRegular, color: cMuted });
  page.drawText("Petugas Pembukuan,", { x: rightX + 25, y, size: 7.5, font: fontRegular, color: cMuted });
  y -= 10;

  page.drawText("Ketua DKM Al-Luqman", { x: leftX + 20, y, size: 8, font: fontBold, color: cBlack });
  page.drawText("Bendahara DKM", { x: rightX + 35, y, size: 8, font: fontBold, color: cBlack });
  y -= 38; // ruang ttd

  page.drawText("( .................................................... )", { x: leftX, y, size: 8, font: fontBold, color: cBlack });
  page.drawText("( .................................................... )", { x: rightX, y, size: 8, font: fontBold, color: cBlack });

  return await doc.save();
}

/**
 * Generate native vector A4 PDF for Weekly Report
 */
export async function generateWeeklyReportPdf(data: WeeklyReportExportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Colors
  const cBlack = rgb(0.1, 0.1, 0.1);
  const cMuted = rgb(0.4, 0.4, 0.4);
  const cLightBg = rgb(0.95, 0.96, 0.95);
  const cBorder = rgb(0.78, 0.8, 0.78);
  const cGreen = rgb(0.02, 0.45, 0.32);
  const cRed = rgb(0.75, 0.1, 0.2);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 36;

  const reportDateFormatted = data.reportDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 1. KOP SURAT
  const dkmTitle = "DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN";
  const dkmTitleWidth = fontBold.widthOfTextAtSize(dkmTitle, 13);
  page.drawText(dkmTitle, {
    x: (pageWidth - dkmTitleWidth) / 2,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.04, 0.38, 0.25),
  });
  y -= 14;

  const dkmAddress = "Jl. Mayjen Sutoyo, Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang - Jawa Barat";
  const dkmAddressWidth = fontRegular.widthOfTextAtSize(dkmAddress, 8);
  page.drawText(dkmAddress, {
    x: (pageWidth - dkmAddressWidth) / 2,
    y,
    size: 8,
    font: fontRegular,
    color: cMuted,
  });
  y -= 8;

  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.5,
    color: cBlack,
  });
  y -= 2;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: cBlack,
  });
  y -= 14;

  // 2. JUDUL
  const docTitle = "REKAPITULASI PEMBUKUAN KAS MINGGUAN";
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 11);
  page.drawText(docTitle, {
    x: (pageWidth - docTitleWidth) / 2,
    y,
    size: 11,
    font: fontBold,
    color: cBlack,
  });
  y -= 12;

  const docSubtitle = `Hari, Tanggal: ${reportDateFormatted}`;
  const docSubtitleWidth = fontRegular.widthOfTextAtSize(docSubtitle, 8.5);
  page.drawText(docSubtitle, {
    x: (pageWidth - docSubtitleWidth) / 2,
    y,
    size: 8.5,
    font: fontRegular,
    color: cMuted,
  });
  y -= 16;

  // 3. KARTU RINGKASAN
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 36;
  const cards = [
    { label: "Saldo Awal Kas:", val: formatRupiah(data.initialBalance), color: cBlack, bg: cLightBg },
    { label: "Total Pemasukan:", val: `+ ${formatRupiah(data.totalIncome)}`, color: cGreen, bg: cLightBg },
    { label: "Total Pengeluaran:", val: `- ${formatRupiah(data.totalExpense)}`, color: cRed, bg: cLightBg },
    { label: "Saldo Kas Akhir:", val: formatRupiah(data.finalBalance), color: cBlack, bg: rgb(0.9, 0.93, 0.9) },
  ];

  cards.forEach((c, idx) => {
    const cx = marginX + idx * (cardWidth + 3);
    page.drawRectangle({
      x: cx,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: c.bg,
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    page.drawText(c.label, {
      x: cx + 5,
      y: y - 11,
      size: 7,
      font: fontRegular,
      color: cMuted,
    });
    page.drawText(c.val, {
      x: cx + 5,
      y: y - 26,
      size: 8.5,
      font: fontBold,
      color: c.color,
    });
  });
  y -= cardHeight + 12;

  // 4. TABEL
  const cols = [
    { key: "no", title: "No", w: 22, align: "center" },
    { key: "date", title: "Tanggal", w: 54, align: "left" },
    { key: "desc", title: "Uraian / Keterangan", w: 165, align: "left" },
    { key: "donor", title: "Sumber / Donatur", w: 98, align: "left" },
    { key: "in", title: "Pemasukan", w: 60, align: "right" },
    { key: "out", title: "Pengeluaran", w: 60, align: "right" },
    { key: "bal", title: "Saldo Kas", w: 64.28, align: "right" },
  ];

  const drawTableHeader = (p: PDFPage, currentY: number) => {
    p.drawRectangle({
      x: marginX,
      y: currentY - 14,
      width: contentWidth,
      height: 14,
      color: rgb(0.88, 0.91, 0.88),
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    let curX = marginX;
    cols.forEach((col) => {
      let tx = curX + 3;
      if (col.align === "center") {
        tx = curX + (col.w - fontBold.widthOfTextAtSize(col.title, 7)) / 2;
      } else if (col.align === "right") {
        tx = curX + col.w - fontBold.widthOfTextAtSize(col.title, 7) - 3;
      }
      p.drawText(col.title, {
        x: tx,
        y: currentY - 10,
        size: 7,
        font: fontBold,
        color: cBlack,
      });
      curX += col.w;
    });
    return currentY - 14;
  };

  y = drawTableHeader(page, y);

  let runningBalance = data.initialBalance;
  const drawRowBorder = (p: PDFPage, ry: number) => {
    p.drawLine({
      start: { x: marginX, y: ry },
      end: { x: pageWidth - marginX, y: ry },
      thickness: 0.5,
      color: cBorder,
    });
  };

  const rowHeight = 13.5;

  page.drawRectangle({
    x: marginX,
    y: y - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: rgb(0.98, 0.98, 0.98),
  });
  page.drawText("-", { x: marginX + 9, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText("-", { x: marginX + 26, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText("Saldo Kas Awal Periode", {
    x: marginX + 22 + 54 + 4,
    y: y - 10,
    size: 7,
    font: fontItalic,
    color: cMuted,
  });
  page.drawText("-", { x: marginX + 22 + 54 + 165 + 98 + 60 - 10, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  page.drawText("-", { x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - 10, y: y - 10, size: 7, font: fontRegular, color: cMuted });
  const initBalStr = formatRupiah(runningBalance);
  page.drawText(initBalStr, {
    x: pageWidth - marginX - fontBold.widthOfTextAtSize(initBalStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cBlack,
  });
  drawRowBorder(page, y - rowHeight);
  y -= rowHeight;

  for (let i = 0; i < data.transactions.length; i++) {
    const tx = data.transactions[i];
    const isIncome = tx.type === "pemasukan";
    if (isIncome) {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    if (y - rowHeight < 80) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 36;
      y = drawTableHeader(page, y);
    }

    const txDateStr = tx.transactionDate
      ? new Date(tx.transactionDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

    const descTrunc = truncateText(tx.description || "-", 158, fontRegular, 6.8);
    const donorTrunc = truncateText(tx.donorNameCanonical || tx.donorNameRaw || (isIncome ? "Infaq Anonim / Kotak Amal" : "-"), 92, fontRegular, 6.8);

    page.drawText(String(i + 1), {
      x: marginX + (22 - fontRegular.widthOfTextAtSize(String(i + 1), 6.8)) / 2,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    page.drawText(txDateStr, {
      x: marginX + 22 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cMuted,
    });

    page.drawText(descTrunc, {
      x: marginX + 22 + 54 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    page.drawText(donorTrunc, {
      x: marginX + 22 + 54 + 165 + 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cMuted,
    });

    const incStr = isIncome ? formatRupiah(tx.amount) : "-";
    page.drawText(incStr, {
      x: marginX + 22 + 54 + 165 + 98 + 60 - fontBold.widthOfTextAtSize(incStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontBold,
      color: isIncome ? cGreen : cMuted,
    });

    const expStr = !isIncome ? formatRupiah(tx.amount) : "-";
    page.drawText(expStr, {
      x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - fontBold.widthOfTextAtSize(expStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontBold,
      color: !isIncome ? cRed : cMuted,
    });

    const balStr = formatRupiah(runningBalance);
    page.drawText(balStr, {
      x: pageWidth - marginX - fontRegular.widthOfTextAtSize(balStr, 6.8) - 3,
      y: y - 9.5,
      size: 6.8,
      font: fontRegular,
      color: cBlack,
    });

    drawRowBorder(page, y - rowHeight);
    y -= rowHeight;
  }

  // Footer Total
  if (y - 16 < 80) {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 36;
  }

  page.drawRectangle({
    x: marginX,
    y: y - 15,
    width: contentWidth,
    height: 15,
    color: rgb(0.92, 0.94, 0.92),
    borderColor: cBlack,
    borderWidth: 0.5,
  });

  const footerLabel = "TOTAL";
  page.drawText(footerLabel, {
    x: marginX + (22 + 54 + 165 + 98 - fontBold.widthOfTextAtSize(footerLabel, 7.5)) / 2,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cBlack,
  });

  const totIncStr = formatRupiah(data.totalIncome);
  page.drawText(totIncStr, {
    x: marginX + 22 + 54 + 165 + 98 + 60 - fontBold.widthOfTextAtSize(totIncStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cGreen,
  });

  const totExpStr = formatRupiah(data.totalExpense);
  page.drawText(totExpStr, {
    x: marginX + 22 + 54 + 165 + 98 + 60 + 60 - fontBold.widthOfTextAtSize(totExpStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cRed,
  });

  const totFinStr = formatRupiah(data.finalBalance);
  page.drawText(totFinStr, {
    x: pageWidth - marginX - fontBold.widthOfTextAtSize(totFinStr, 7.5) - 3,
    y: y - 10.5,
    size: 7.5,
    font: fontBold,
    color: cBlack,
  });
  y -= 25;

  // 5. TANDA TANGAN
  if (y < 70) {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 36;
  }

  const signDateStr = `Subang, ${reportDateFormatted}`;
  const signDateWidth = fontRegular.widthOfTextAtSize(signDateStr, 7.5);
  page.drawText(signDateStr, {
    x: pageWidth - marginX - signDateWidth,
    y,
    size: 7.5,
    font: fontRegular,
    color: cBlack,
  });
  y -= 14;

  const colSignWidth = contentWidth / 2;
  const leftX = marginX + (colSignWidth - 140) / 2;
  const rightX = marginX + colSignWidth + (colSignWidth - 140) / 2;

  page.drawText("Mengetahui,", { x: leftX + 40, y, size: 7.5, font: fontRegular, color: cMuted });
  page.drawText("Petugas Pembukuan,", { x: rightX + 25, y, size: 7.5, font: fontRegular, color: cMuted });
  y -= 10;

  page.drawText("Ketua DKM Al-Luqman", { x: leftX + 20, y, size: 8, font: fontBold, color: cBlack });
  page.drawText("Bendahara DKM", { x: rightX + 35, y, size: 8, font: fontBold, color: cBlack });
  y -= 38;

  page.drawText("( .................................................... )", { x: leftX, y, size: 8, font: fontBold, color: cBlack });
  const uploaderName = `( ${data.uploadedByName || "Pengurus DKM"} )`;
  page.drawText(uploaderName, { x: rightX + (140 - fontBold.widthOfTextAtSize(uploaderName, 8)) / 2, y, size: 8, font: fontBold, color: cBlack });

  return await doc.save();
}

/**
 * Generate native vector A4 PDF for Yearly Report
 */
export async function generateYearlyReportPdf(data: YearlyReportExportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const cBlack = rgb(0.1, 0.1, 0.1);
  const cMuted = rgb(0.4, 0.4, 0.4);
  const cLightBg = rgb(0.95, 0.96, 0.95);
  const cBorder = rgb(0.78, 0.8, 0.78);
  const cGreen = rgb(0.02, 0.45, 0.32);
  const cRed = rgb(0.75, 0.1, 0.2);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // 523.28

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 36;

  // 1. KOP SURAT
  const dkmTitle = "DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN";
  const dkmTitleWidth = fontBold.widthOfTextAtSize(dkmTitle, 13);
  page.drawText(dkmTitle, {
    x: (pageWidth - dkmTitleWidth) / 2,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.04, 0.38, 0.25),
  });
  y -= 14;

  const dkmAddress = "Jl. Mayjen Sutoyo, Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang - Jawa Barat";
  const dkmAddressWidth = fontRegular.widthOfTextAtSize(dkmAddress, 8);
  page.drawText(dkmAddress, {
    x: (pageWidth - dkmAddressWidth) / 2,
    y,
    size: 8,
    font: fontRegular,
    color: cMuted,
  });
  y -= 8;

  // Garis Kop Ganda
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.5,
    color: cBlack,
  });
  y -= 2;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: cBlack,
  });
  y -= 14;

  // 2. JUDUL
  const docTitle = "REKAPITULASI PEMBUKUAN KAS TAHUNAN";
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 11);
  page.drawText(docTitle, {
    x: (pageWidth - docTitleWidth) / 2,
    y,
    size: 11,
    font: fontBold,
    color: cBlack,
  });
  y -= 12;

  const docSubtitle = `Periode Fiskal: Tahun ${data.year} (Januari - Desember)`;
  const docSubtitleWidth = fontRegular.widthOfTextAtSize(docSubtitle, 8.5);
  page.drawText(docSubtitle, {
    x: (pageWidth - docSubtitleWidth) / 2,
    y,
    size: 8.5,
    font: fontRegular,
    color: cMuted,
  });
  y -= 16;

  // 3. KARTU RINGKASAN SALDO (4 Kotak)
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 36;
  const cards = [
    { label: "Saldo Awal Tahun:", val: formatRupiah(data.initialBalance), color: cBlack, bg: cLightBg },
    { label: "Total Pemasukan:", val: `+ ${formatRupiah(data.totalIncome)}`, color: cGreen, bg: cLightBg },
    { label: "Total Pengeluaran:", val: `- ${formatRupiah(data.totalExpense)}`, color: cRed, bg: cLightBg },
    { label: "Saldo Akhir Kas:", val: formatRupiah(data.finalBalance), color: cBlack, bg: rgb(0.9, 0.93, 0.9) },
  ];

  cards.forEach((c, idx) => {
    const cx = marginX + idx * (cardWidth + 3);
    page.drawRectangle({
      x: cx,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: c.bg,
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    page.drawText(c.label, {
      x: cx + 5,
      y: y - 11,
      size: 7,
      font: fontRegular,
      color: cMuted,
    });
    page.drawText(c.val, {
      x: cx + 5,
      y: y - 26,
      size: 8.5,
      font: fontBold,
      color: c.color,
    });
  });
  y -= cardHeight + 14;

  // 4. TABEL REKAPITULASI 12 BULAN
  page.drawText("RINGKASAN MUTASI KAS BULANAN (12 BULAN)", {
    x: marginX,
    y,
    size: 8,
    font: fontBold,
    color: cBlack,
  });
  y -= 10;

  const mCols = [
    { key: "no", title: "No", w: 22, align: "center" },
    { key: "month", title: "Bulan", w: 90, align: "left" },
    { key: "reports", title: "Laporan", w: 45, align: "center" },
    { key: "in", title: "Pemasukan (Rp)", w: 88, align: "right" },
    { key: "out", title: "Pengeluaran (Rp)", w: 88, align: "right" },
    { key: "net", title: "Surplus / Defisit", w: 92, align: "right" },
    { key: "bal", title: "Saldo Akhir (Rp)", w: 98.28, align: "right" },
  ];

  // Table header
  page.drawRectangle({
    x: marginX,
    y: y - 14,
    width: contentWidth,
    height: 14,
    color: rgb(0.88, 0.91, 0.88),
    borderColor: cBorder,
    borderWidth: 0.5,
  });
  let curX = marginX;
  mCols.forEach((col) => {
    let tx = curX + 3;
    if (col.align === "center") {
      tx = curX + (col.w - fontBold.widthOfTextAtSize(col.title, 7)) / 2;
    } else if (col.align === "right") {
      tx = curX + col.w - fontBold.widthOfTextAtSize(col.title, 7) - 3;
    }
    page.drawText(col.title, {
      x: tx,
      y: y - 10,
      size: 7,
      font: fontBold,
      color: cBlack,
    });
    curX += col.w;
  });
  y -= 14;

  // 12 baris bulan
  const totalReportsCount = data.monthSummaries.reduce((acc, m) => acc + m.reportCount, 0);

  data.monthSummaries.forEach((ms, idx) => {
    const rowBg = idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98);
    page.drawRectangle({
      x: marginX,
      y: y - 13,
      width: contentWidth,
      height: 13,
      color: rowBg,
      borderColor: cBorder,
      borderWidth: 0.3,
    });

    let rx = marginX;
    // No
    const noStr = String(ms.month);
    page.drawText(noStr, { x: rx + (22 - fontRegular.widthOfTextAtSize(noStr, 6.5)) / 2, y: y - 9.5, size: 6.5, font: fontRegular, color: cMuted });
    rx += 22;

    // Nama Bulan
    page.drawText(ms.monthName, { x: rx + 3, y: y - 9.5, size: 7, font: fontBold, color: cBlack });
    rx += 90;

    // Laporan Count
    const repStr = `${ms.reportCount} lap`;
    page.drawText(repStr, { x: rx + (45 - fontRegular.widthOfTextAtSize(repStr, 6.5)) / 2, y: y - 9.5, size: 6.5, font: fontRegular, color: cBlack });
    rx += 45;

    // Pemasukan
    const inStr = ms.income > 0 ? formatRupiah(ms.income) : "-";
    page.drawText(inStr, { x: rx + 88 - fontRegular.widthOfTextAtSize(inStr, 6.5) - 3, y: y - 9.5, size: 6.5, font: fontRegular, color: ms.income > 0 ? cGreen : cMuted });
    rx += 88;

    // Pengeluaran
    const outStr = ms.expense > 0 ? formatRupiah(ms.expense) : "-";
    page.drawText(outStr, { x: rx + 88 - fontRegular.widthOfTextAtSize(outStr, 6.5) - 3, y: y - 9.5, size: 6.5, font: fontRegular, color: ms.expense > 0 ? cRed : cMuted });
    rx += 88;

    // Surplus/Defisit
    const netStr = ms.net === 0 ? "-" : (ms.net > 0 ? `+ ${formatRupiah(ms.net)}` : formatRupiah(ms.net));
    const netColor = ms.net > 0 ? cGreen : (ms.net < 0 ? cRed : cMuted);
    page.drawText(netStr, { x: rx + 92 - fontRegular.widthOfTextAtSize(netStr, 6.5) - 3, y: y - 9.5, size: 6.5, font: fontRegular, color: netColor });
    rx += 92;

    // Saldo Akhir
    const balStr = formatRupiah(ms.closingBalance);
    page.drawText(balStr, { x: rx + 98.28 - fontBold.widthOfTextAtSize(balStr, 6.5) - 3, y: y - 9.5, size: 6.5, font: fontBold, color: cBlack });

    y -= 13;
  });

  // Baris Total Akumulasi
  page.drawRectangle({
    x: marginX,
    y: y - 14,
    width: contentWidth,
    height: 14,
    color: rgb(0.92, 0.94, 0.92),
    borderColor: cBorder,
    borderWidth: 0.5,
  });

  page.drawText("TOTAL TAHUNAN", {
    x: marginX + 26,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cBlack,
  });

  const totRepStr = `${totalReportsCount} lap`;
  page.drawText(totRepStr, {
    x: marginX + 112 + (45 - fontBold.widthOfTextAtSize(totRepStr, 7)) / 2,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cBlack,
  });

  const totInStr = formatRupiah(data.totalIncome);
  page.drawText(totInStr, {
    x: marginX + 157 + 88 - fontBold.widthOfTextAtSize(totInStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cGreen,
  });

  const totOutStr = formatRupiah(data.totalExpense);
  page.drawText(totOutStr, {
    x: marginX + 245 + 88 - fontBold.widthOfTextAtSize(totOutStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cRed,
  });

  const netTot = data.totalIncome - data.totalExpense;
  const totNetStr = netTot === 0 ? "-" : (netTot > 0 ? `+ ${formatRupiah(netTot)}` : formatRupiah(netTot));
  page.drawText(totNetStr, {
    x: marginX + 333 + 92 - fontBold.widthOfTextAtSize(totNetStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: netTot >= 0 ? cGreen : cRed,
  });

  const totFinStr = formatRupiah(data.finalBalance);
  page.drawText(totFinStr, {
    x: pageWidth - marginX - fontBold.widthOfTextAtSize(totFinStr, 7) - 3,
    y: y - 10,
    size: 7,
    font: fontBold,
    color: cBlack,
  });

  y -= 25;

  // 5. TANDA TANGAN
  if (y < 80) {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 36;
  }

  const signDateStr = `Subang, 31 Desember ${data.year}`;
  const signDateWidth = fontRegular.widthOfTextAtSize(signDateStr, 7.5);
  page.drawText(signDateStr, {
    x: pageWidth - marginX - signDateWidth,
    y,
    size: 7.5,
    font: fontRegular,
    color: cBlack,
  });
  y -= 14;

  const colSignWidth = contentWidth / 2;
  const leftX = marginX + (colSignWidth - 140) / 2;
  const rightX = marginX + colSignWidth + (colSignWidth - 140) / 2;

  page.drawText("Mengetahui,", { x: leftX + 40, y, size: 7.5, font: fontRegular, color: cMuted });
  page.drawText("Petugas Pembukuan,", { x: rightX + 25, y, size: 7.5, font: fontRegular, color: cMuted });
  y -= 10;

  page.drawText("Ketua DKM Al-Luqman", { x: leftX + 20, y, size: 8, font: fontBold, color: cBlack });
  page.drawText("Bendahara DKM", { x: rightX + 35, y, size: 8, font: fontBold, color: cBlack });
  y -= 38;

  page.drawText("( .................................................... )", { x: leftX, y, size: 8, font: fontBold, color: cBlack });
  page.drawText("( .................................................... )", { x: rightX, y, size: 8, font: fontBold, color: cBlack });

  return await doc.save();
}
