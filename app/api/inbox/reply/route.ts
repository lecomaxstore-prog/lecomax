import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const securityDenied = await protectAdminMutation(req, { key: "inbox/reply/route.ts:POST" });
  if (securityDenied) return securityDenied;
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const body = await readJsonLimited(req, 64 * 1024).catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { to, subject, text, replyTo } = body;

  if (typeof to !== "string" || to.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to) ||
      typeof subject !== "string" || !subject.trim() || subject.length > 200 || /[\r\n]/.test(subject) ||
      typeof text !== "string" || !text.trim() || text.length > 50_000 ||
      (replyTo !== undefined && (typeof replyTo !== "string" || replyTo.length > 300 || /[\r\n]/.test(replyTo)))) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    disableFileAccess: true,
    disableUrlAccess: true,
    auth: {
      user: process.env.PRIVATE_EMAIL_USER || "contact@lecomax.com",
      pass: process.env.PRIVATE_EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `L'ecomax <contact@lecomax.com>`,
      to,
      subject,
      text,
      ...(replyTo ? { inReplyTo: replyTo } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SMTP error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
