import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supportDatabase, supportFailure } from '@/lib/support-server';
import { decodeSupportBody, detectSupportFile, supportPreview, SUPPORT_ATTACHMENT_PREFIX, SUPPORT_FILE_LIMIT } from '@/lib/support-attachments';
import { validSupportId } from '@/lib/support-validation';
import { readFormDataLimited } from '@/lib/request-body';
import { validMediaBytes } from '@/lib/upload-validation';

const BUCKET = 'support-private';

export async function presentSupportMessage(message: Record<string, unknown>) {
  const decoded = decodeSupportBody(String(message.body ?? ''));
  if (!decoded.file) return message;
  const prefix = `${message.conversation_id}/`;
  if (!decoded.file.path.startsWith(prefix) || decoded.file.path.includes('..')) return { ...message, body: 'Pièce jointe indisponible.' };
  const { data } = await supportDatabase().storage.from(BUCKET).createSignedUrl(decoded.file.path, 3600, { download: decoded.file.type === 'application/pdf' ? decoded.file.name : false });
  return { ...message, body: decoded.text, attachment: { ...decoded.file, url: data?.signedUrl ?? null } };
}

export async function presentSupportThread(data: { messages: Record<string, unknown>[]; [key: string]: unknown }) {
  const conversation = data.conversation as Record<string, unknown>;
  return { ...data, conversation: { ...conversation, last_message: supportPreview(String(conversation.last_message ?? '')) }, messages: await Promise.all(data.messages.map(presentSupportMessage)) };
}

export async function sendSupportFile(req: NextRequest, id: string, sender: 'customer' | 'support', userId: string | null) {
  if (Number(req.headers.get('content-length')) > SUPPORT_FILE_LIMIT + 100_000) return NextResponse.json({ error: 'Le fichier doit faire moins de 3 Mo.' }, { status: 413 });
  const db = supportDatabase();
  let ownership = db.from('support_conversations').select('id').eq('id', id);
  if (sender === 'customer') ownership = ownership.eq('user_id', userId!);
  const { data: conversation, error: ownershipError } = await ownership.maybeSingle();
  if (ownershipError) return supportFailure(ownershipError, 'Conversation indisponible.');
  if (!conversation) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });
  const form = await readFormDataLimited(req, SUPPORT_FILE_LIMIT + 100_000).catch(() => null);
  const file = form?.get('file');
  const clientId = form?.get('client_message_id');
  if (!(file instanceof File) || !validSupportId(clientId)) return NextResponse.json({ error: 'Fichier ou identifiant invalide.' }, { status: 400 });
  if (!file.size || file.size > SUPPORT_FILE_LIMIT) return NextResponse.json({ error: 'Le fichier doit faire entre 1 octet et 3 Mo.' }, { status: 413 });
  const caption = String(form?.get('body') ?? '').trim();
  if (caption.length > 1000) return NextResponse.json({ error: 'La légende est limitée à 1 000 caractères.' }, { status: 400 });
  const { data: existing } = await db.from('support_messages').select('*').eq('conversation_id', id).eq('client_message_id', clientId).maybeSingle();
  if (existing) {
    if (existing.sender_type !== sender) return NextResponse.json({ error: 'Identifiant déjà utilisé.' }, { status: 409 });
    return NextResponse.json({ message: await presentSupportMessage(existing) }, { status: 200 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectSupportFile(bytes);
  if (!type) return NextResponse.json({ error: 'Formats acceptés : JPG, PNG, WebP et PDF.' }, { status: 415 });
  if (type.startsWith('image/') && !(await validMediaBytes(Buffer.from(bytes), type))) {
    return NextResponse.json({ error: 'Image invalide ou dimensions excessives.' }, { status: 415 });
  }
  const name = file.name.replace(/[\x00-\x1f/\\]/g, '_').slice(0, 120) || 'Document';
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[type];
  const path = `${id}/${clientId}/${randomUUID()}.${extension}`;
  const body = SUPPORT_ATTACHMENT_PREFIX + JSON.stringify({ text: caption, file: { path, name, type, size: file.size } });
  if (body.length > 2000) return NextResponse.json({ error: 'La légende est trop longue. Raccourcissez votre message.' }, { status: 400 });
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Le fichier n’a pas pu être envoyé. Réessayez.' }, { status: 503 });
  const { data, error } = await db.rpc('support_send_message', {
    p_conversation_id: id, p_sender: sender, p_user_id: userId, p_body: body, p_client_id: clientId,
  });
  if (error) {
    await db.storage.from(BUCKET).remove([path]);
    return supportFailure(error, 'Le fichier n’a pas pu être enregistré. Réessayez.');
  }
  return NextResponse.json({ message: await presentSupportMessage(data.message) }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
