"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Submit Lyrics ────────────────────────────────────────────────────────────
// User pastes raw lyrics → Gemini formats them → saved as PENDING submission.

export async function submitLyrics(mezmurId: string, rawText: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHENTICATED" };
  }

  if (!rawText || rawText.trim().length < 10) {
    return { error: "LYRICS_TOO_SHORT" };
  }

  if (rawText.length > 10000) {
    return { error: "LYRICS_TOO_LONG" };
  }

  // Check the mezmur exists
  const mezmur = await prisma.mezmur.findUnique({
    where: { id: mezmurId },
    select: { id: true, title: true },
  });

  if (!mezmur) {
    return { error: "MEZMUR_NOT_FOUND" };
  }

  // Rate limit: prevent spam (max 3 pending submissions per user)
  const pendingCount = await prisma.lyricsSubmission.count({
    where: {
      userId: session.user.id,
      status: "PENDING",
    },
  });

  if (pendingCount >= 3) {
    return { error: "TOO_MANY_PENDING" };
  }

  // Format lyrics using Gemini
  let formattedLines: string[];
  try {
    formattedLines = await formatLyricsWithGemini(rawText, mezmur.title);
  } catch {
    // If Gemini fails, fall back to simple line splitting
    formattedLines = rawText
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // Save the submission
  await prisma.lyricsSubmission.create({
    data: {
      rawText: rawText.trim(),
      formattedLines,
      status: "PENDING",
      mezmurId,
      userId: session.user.id,
    },
  });

  return { success: true };
}

// ── Gemini Formatter ─────────────────────────────────────────────────────────
// Takes raw pasted lyrics and returns clean, structured lines.

async function formatLyricsWithGemini(
  rawText: string,
  mezmurTitle: string
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a lyrics formatter for Ethiopian Orthodox Tewahedo Mezmurs (hymns).

The Mezmur title is: "${mezmurTitle}"

A user has pasted the following raw lyrics text. Your job:
1. Clean up the formatting — remove any numbering, extra spaces, or symbols.
2. Organize into proper verse lines.
3. Separate verses with a single EMPTY LINE between them.
4. Keep ONLY the Amharic/Ge'ez text. Remove any English text, emojis, or credits.
5. Preserve the original order and wording — do NOT translate or paraphrase.
6. Return ONLY the formatted lyrics, nothing else. No explanations.

Raw text:
${rawText}`;

  const result = await model.generateContent(prompt);
  const formatted = result.response.text().trim();

  // Split into lines, keeping empty lines as verse separators
  return formatted.split("\n").map((line) => line.trim());
}

// ── Admin: Get Pending Submissions ───────────────────────────────────────────

export async function getPendingSubmissions() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHORIZED" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "SUPER_ADMIN") {
    return { error: "NOT_AUTHORIZED" };
  }

  const submissions = await prisma.lyricsSubmission.findMany({
    where: { status: "PENDING" },
    include: {
      mezmur: { select: { id: true, title: true, lyrics: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return { submissions };
}

// ── Admin: Approve Submission ────────────────────────────────────────────────

export async function approveSubmission(submissionId: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHORIZED" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "SUPER_ADMIN") {
    return { error: "NOT_AUTHORIZED" };
  }

  const submission = await prisma.lyricsSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) return { error: "NOT_FOUND" };

  // Update the mezmur's lyrics with the approved submission
  await prisma.$transaction([
    prisma.mezmur.update({
      where: { id: submission.mezmurId },
      data: { lyrics: submission.formattedLines },
    }),
    prisma.lyricsSubmission.update({
      where: { id: submissionId },
      data: { status: "APPROVED" },
    }),
  ]);

  return { success: true };
}

// ── Admin: Reject Submission ─────────────────────────────────────────────────

export async function rejectSubmission(
  submissionId: string,
  adminNote?: string
) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHORIZED" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "SUPER_ADMIN") {
    return { error: "NOT_AUTHORIZED" };
  }

  await prisma.lyricsSubmission.update({
    where: { id: submissionId },
    data: {
      status: "REJECTED",
      adminNote: adminNote || null,
    },
  });

  return { success: true };
}
