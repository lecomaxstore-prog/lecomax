/** Existing store policy: the customer pays return postage except for our errors/defects. */
const days = 30;
const label = "Retours sous conditions";
const window = `${days} jours`;
export const RETURN_POLICY = {
  days,
  label,
  window,
  summary: `${label} · ${window}`,
  description: `Vous disposez de ${window} après réception pour demander un retour, sous réserve des conditions de notre politique de retour.`,
  fees: "Les frais de retour sont à votre charge sauf en cas d'erreur de notre part ou de produit défectueux, auquel cas nous prenons tout en charge.",
} as const;
