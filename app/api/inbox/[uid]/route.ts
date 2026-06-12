import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const IMAP_CONFIG = {
  host: "mail.privateemail.com",
  port: 993,
  secure: true,
  auth: {
    user: process.env.PRIVATE_EMAIL_USER || "contact@lecomax.com",
    pass: process.env.PRIVATE_EMAIL_PASS || "",
  },
  logger: false,
};

// GET /api/inbox/[uid] - fetch full email body
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const { uid } = await params;
  const client = new ImapFlow(IMAP_CONFIG);

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Mark as read
      await client.messageFlagsAdd({ uid: parseInt(uid) }, ["\\Seen"], { uid: true });

      // Download full message
      const download = await client.download({ uid: parseInt(uid) }, undefined, { uid: true });
      if (!download) return NextResponse.json({ error: "Message not found" }, { status: 404 });

      const parsed = await simpleParser(download.content);

      return NextResponse.json({
        uid,
        subject: parsed.subject || "(no subject)",
        from: parsed.from?.text || "Unknown",
        fromAddress: parsed.from?.value?.[0]?.address || "",
        to: parsed.to?.text || "",
        date: parsed.date?.toISOString() || new Date().toISOString(),
        text: parsed.text || "",
        html: parsed.html || "",
        attachments: (parsed.attachments || []).map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
        })),
      });
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "IMAP error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}

// DELETE /api/inbox/[uid] - delete/trash email
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const { uid } = await params;
  const client = new ImapFlow(IMAP_CONFIG);

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      await client.messageDelete({ uid: parseInt(uid) }, { uid: true });
      return NextResponse.json({ success: true });
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "IMAP error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}

// PATCH /api/inbox/[uid] - mark read/unread
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const { uid } = await params;
  const body = await req.json();
  const client = new ImapFlow(IMAP_CONFIG);

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      if (body.read === false) {
        await client.messageFlagsRemove({ uid: parseInt(uid) }, ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsAdd({ uid: parseInt(uid) }, ["\\Seen"], { uid: true });
      }
      return NextResponse.json({ success: true });
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "IMAP error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}
