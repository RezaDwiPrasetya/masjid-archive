import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDonorName, isAnonymousDonor } from "@/lib/donor-matching";

// POST /api/transactions/:id/confirm
// Mengonfirmasi satu baris transaksi sebagai data resmi (isVerified = true)
// V5: Menyertakan pencocokan donatur (fuzzy matching) saat transaksi dikonfirmasi
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { verifiedBy: { select: { name: true } } },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  if (transaction.isVerified) {
    return NextResponse.json(
      { error: "Transaksi ini sudah dikonfirmasi sebelumnya." },
      { status: 409 }
    );
  }

  // Parse body opsional: { donorNameRaw?: string | null }
  let donorNameRawFromBody: string | null | undefined = undefined;
  try {
    const text = await request.text();
    if (text) {
      const json = JSON.parse(text);
      if (json && typeof json === "object" && "donorNameRaw" in json) {
        donorNameRawFromBody =
          typeof json.donorNameRaw === "string" ? json.donorNameRaw : null;
      }
    }
  } catch {
    // Body kosong atau bukan JSON valid, diabaikan
  }

  // Tentukan input nama mentah: gunakan dari body jika disediakan, atau fallback ke data transaksi
  const rawInput =
    donorNameRawFromBody !== undefined
      ? donorNameRawFromBody
      : transaction.donorNameRaw;

  let donorId: string | null = null;
  let finalDonorNameRaw: string | null = null;
  let matchingResult: {
    status: "existing" | "created" | "anonymous" | "none";
    donorName: string | null;
  } = {
    status: "none",
    donorName: null,
  };

  // Matching donor hanya relevan untuk transaksi pemasukan
  if (
    transaction.type === "pemasukan" &&
    rawInput &&
    rawInput.trim().length > 0
  ) {
    const trimmedRaw = rawInput.trim();
    finalDonorNameRaw = trimmedRaw;
    const normalized = normalizeDonorName(trimmedRaw);

    // Jika anonim ("hamba allah", "hamba alloh", "anonim", "tanpa nama") atau kosong setelah normalisasi:
    // donorId tetap null (JANGAN buat entitas Donor baru)
    if (isAnonymousDonor(normalized) || normalized.length === 0) {
      matchingResult = {
        status: "anonymous",
        donorName: null,
      };
    } else {
      const existingDonor = await prisma.donor.findUnique({
        where: { normalizedName: normalized },
      });

      if (existingDonor) {
        donorId = existingDonor.id;
        matchingResult = {
          status: "existing",
          donorName: existingDonor.name,
        };
      } else {
        const newDonor = await prisma.donor.create({
          data: {
            name: trimmedRaw, // Nama asli sebelum normalisasi sebagai nama canonical
            normalizedName: normalized,
          },
        });
        donorId = newDonor.id;
        matchingResult = {
          status: "created",
          donorName: newDonor.name,
        };
      }
    }
  }

  const confirmed = await prisma.transaction.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedById: session.user.id,
      verifiedAt: new Date(),
      donorId,
      donorNameRaw: finalDonorNameRaw,
    },
    include: {
      verifiedBy: { select: { name: true } },
      donor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    data: {
      id: confirmed.id,
      isVerified: confirmed.isVerified,
      verifiedBy: confirmed.verifiedBy?.name ?? null,
      verifiedAt: confirmed.verifiedAt,
      donorId: confirmed.donorId,
      donorNameRaw: confirmed.donorNameRaw,
      donor: confirmed.donor
        ? { id: confirmed.donor.id, name: confirmed.donor.name }
        : null,
      matchingResult,
    },
  });
}
