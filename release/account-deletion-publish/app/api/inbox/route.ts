import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

const IMAP_CONFIG = {
  host: "mail.privateemail.com",
  port: 993,
  secure: true,
  auth: {
    user: process.env.PRIVATE_EMAIL_USER || "contact@lecomax.com",
    pass: process.env.PRIVATE_EMAIL_PASS || "",
  },
} as const;

export async function GET(req: NextRequest) {
  const securityDenied = await protectAdminRead(req, { key: "inbox/route.ts:GET" });
  if (securityDenied) return securityDenied;
  if (!process.env.PRIVATE_EMAIL_PASS) {
    return NextResponse.json({ error: "PRIVATE_EMAIL_PASS not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "INBOX";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");

  const client = new ImapFlow(IMAP_CONFIG);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const mailbox = client.mailbox;
      const total = (mailbox && typeof mailbox === "object") ? mailbox.exists : 0;

      // Fetch most recent emails (reverse order)
      const from = Math.max(1, total - (page * limit) + 1);
      const to = Math.max(1, total - ((page - 1) * limit));

      const emails: object[] = [];

      if (total > 0 && from <= to) {
        for await (const msg of client.fetch(`${from}:${to}`, {
          envelope: true,
          flags: true,
          bodyStructure: true,
        })) {
          emails.unshift({
            uid: msg.uid,
            seq: msg.seq,
            subject: msg.envelope?.subject || "(no subject)",
            from: msg.envelope?.from?.[0]
              ? `${msg.envelope.from[0].name || ""} <${msg.envelope.from[0].address}>`.trim()
              : "Unknown",
            fromAddress: msg.envelope?.from?.[0]?.address || "",
            date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
            read: msg.flags?.has("\\Seen") ?? false,
            hasAttachment: msg.bodyStructure?.childNodes?.some?.(
              (n: { type?: string }) => n.type === "attachment"
            ) ?? false,
          });
        }
      }

      return NextResponse.json({ emails, total, page, limit });
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
