import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { to, subject, text, replyTo } = body;

  if (!to || !subject || !text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 587,
    secure: false,
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
