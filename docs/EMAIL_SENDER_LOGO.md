# Gmail sender logo (BIMI)

The image displayed inside an email is controlled by the HTML template. The circular sender avatar shown by Gmail is controlled by the receiving mailbox and cannot be set with a favicon or an email HTML tag.

L'ecomax hosts a BIMI-ready SVG at:

`https://lecomax.com/brand/lecomax-bimi.svg`

## Required DNS and certificate setup

1. Confirm a delivered order email shows `DKIM: PASS` with `header.d=lecomax.com` and `DMARC: PASS` in Gmail's **Show original** view.
2. Add a DMARC TXT record at `_dmarc.lecomax.com`. BIMI requires an enforced policy (`p=quarantine` or `p=reject`) with `pct=100`; `p=none` is not sufficient.
3. Obtain a Common Mark Certificate (CMC) for the logo, or a Verified Mark Certificate (VMC) if the logo becomes a registered trademark. Gmail does not display a standalone BIMI SVG without a supported mark certificate.
4. Host the CA-provided PEM certificate on `https://lecomax.com/brand/`.
5. Add the CA-provided BIMI TXT assertion at `default._bimi.lecomax.com`, pointing to the HTTPS certificate URL (and the logo URL when the issuer requires it).
6. Allow DNS and Gmail caches up to 48 hours to update.

Do not enable DMARC enforcement until all legitimate senders for `lecomax.com` pass aligned SPF or DKIM. Current senders include Resend for transactional messages and Private Email when that service is active.

Official reference: https://knowledge.workspace.google.com/admin/security/set-up-bimi
