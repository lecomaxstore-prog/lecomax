const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export const confirmationEmailSubject = "Bienvenue chez L’ecomax — confirmez votre email";

/** Table layout and inline styles keep the message readable in email clients. */
export function confirmationEmailHtml(confirmationUrl: string) {
  const url = escapeHtml(confirmationUrl);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmez votre email | L’ecomax</title></head>
<body style="margin:0;padding:0;background:#f3f4f0;color:#111811;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Votre compte L’ecomax est presque prêt. Une dernière étape pour nous rejoindre.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f0;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
<tr><td style="padding:22px 0 28px;font-size:32px;font-weight:900;letter-spacing:-1.5px;">L’eco<span style="color:#168526;">max</span><span style="display:block;margin-top:8px;font-size:10px;letter-spacing:2px;font-weight:700;color:#536052;">VOTRE STYLE. VOTRE ÉLAN.</span></td></tr>
<tr><td style="background:#183d29;padding:36px 28px 40px;border-radius:16px 16px 0 0;">
<p style="margin:0 0 22px;font-size:11px;font-weight:700;letter-spacing:2px;color:#bbedad;">BIENVENUE CHEZ L’ECOMAX</p>
<h1 style="margin:0;font-size:38px;line-height:1.08;letter-spacing:-1.5px;color:#ffffff;">Tout commence<br>avec vous.</h1>
<p style="margin:20px 0 0;color:#e0e9df;font-size:15px;line-height:1.7;">Votre compte est presque prêt.<br>Confirmez votre email pour nous rejoindre.</p>
</td></tr>
<tr><td style="background:#ffffff;padding:32px 28px;border-radius:0 0 16px 16px;">
<h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;letter-spacing:-0.5px;">Une dernière étape.</h2>
<p style="margin:0 0 26px;font-size:15px;line-height:1.75;color:#566052;">Cliquez ci-dessous pour confirmer votre adresse email et accéder à votre espace L’ecomax.</p>
<table role="presentation" cellspacing="0" cellpadding="0" width="100%"><tr><td align="center" bgcolor="#111811" style="border-radius:8px;mso-padding-alt:19px 24px;"><a href="${url}" style="display:block;padding:19px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:22px;">Confirmer mon email &nbsp; &rarr;</a></td></tr></table>
<p style="margin:18px 0 28px;font-size:12px;line-height:1.6;text-align:center;color:#667060;">Un clic pour confirmer. Puis, à vous de jouer.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="border-top:1px solid #e7ebe4;padding-top:24px;">
<p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#667060;">Vous n’avez pas demandé la création de ce compte ? Vous pouvez ignorer cet email.</p>
<p style="margin:0;font-size:12px;line-height:1.7;color:#667060;">Le bouton ne fonctionne pas ? <a href="${url}" style="color:#183d29;text-decoration:underline;">Ouvrir le lien de confirmation</a>.</p>
</td></tr></table>
</td></tr>
<tr><td style="padding:26px 12px;text-align:center;">
<p style="margin:0 0 10px;font-size:13px;color:#43503e;">Besoin d’un coup de main ? <a href="mailto:contact@lecomax.com" style="color:#183d29;text-decoration:underline;">Contactez-nous</a></p>
<p style="margin:0;font-size:11px;line-height:1.8;color:#667060;">L’ecomax · Maroc<br>Cet email accompagne la création de votre compte.<br><a href="https://lecomax.com" style="color:#43503e;text-decoration:none;">lecomax.com</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

export function confirmationEmailText(url: string) {
  return `Bienvenue chez L’ecomax.\n\nVotre compte est presque prêt. Confirmez votre email pour accéder à votre espace :\n${url}\n\nSi vous n’avez pas demandé la création de ce compte, ignorez cet email.\nBesoin d’aide ? contact@lecomax.com\nL’ecomax · lecomax.com`;
}
