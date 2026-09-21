import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODEL = "gemini-3.6-flash";

// Singleton Gemini client — pola identik dengan lib/prisma.ts
// Tidak perlu menginisialisasi ulang per request.
const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenerativeAI | undefined;
};

export const gemini =
  globalForGemini.gemini ??
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

if (process.env.NODE_ENV !== "production") {
  globalForGemini.gemini = gemini;
}
