import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeDonorName, isAnonymousDonor } from "@/lib/donor-matching";

export type DonorMatchingResult = {
  donorId: string | null;
  finalDonorNameRaw: string | null;
  matchingResult: {
    status: "existing" | "created" | "anonymous" | "none";
    donorName: string | null;
  };
};

/**
 * Logika pencocokan donatur (fuzzy matching & normalisasi).
 * Digunakan bersama oleh:
 * - POST /api/transactions/:id/confirm
 * - PATCH /api/transactions/:id/donor
 */
export async function matchAndAssignDonor(
  txType: string,
  rawInput: string | null | undefined
): Promise<DonorMatchingResult> {
  let donorId: string | null = null;
  let finalDonorNameRaw: string | null = null;
  let matchingResult: {
    status: "existing" | "created" | "anonymous" | "none";
    donorName: string | null;
  } = {
    status: "none",
    donorName: null,
  };

  // Matching donor hanya relevan untuk transaksi pemasukan dengan nama yang diisi
  if (
    txType === "pemasukan" &&
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
        try {
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
        } catch (createError: unknown) {
          const isP2002 =
            createError instanceof Prisma.PrismaClientKnownRequestError
              ? createError.code === "P2002"
              : Boolean(
                  createError &&
                    typeof createError === "object" &&
                    "code" in createError &&
                    (createError as { code: string }).code === "P2002"
                );

          if (isP2002) {
            const fallbackDonor = await prisma.donor.findUnique({
              where: { normalizedName: normalized },
            });
            if (fallbackDonor) {
              donorId = fallbackDonor.id;
              matchingResult = {
                status: "existing",
                donorName: fallbackDonor.name,
              };
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    }
  }

  return {
    donorId,
    finalDonorNameRaw,
    matchingResult,
  };
}
