import { mkdir, writeFile } from 'node:fs/promises';
import { confirmationEmailHtml } from '../lib/auth-confirmation-email.ts';

await mkdir(new URL('../supabase/templates/', import.meta.url), { recursive: true });
await writeFile(new URL('../supabase/templates/confirmation.html', import.meta.url), confirmationEmailHtml('{{ .ConfirmationURL }}'));
console.log('Generated supabase/templates/confirmation.html');
