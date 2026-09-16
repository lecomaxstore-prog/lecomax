import { preorderCopy } from "@/lib/preorder-copy";
import type { PreorderSnapshot } from "@/lib/preorder";

export default function PreorderNotice({ item, language = "fr" }: { item: PreorderSnapshot; language?: "fr" | "en" }) {
  if (item.fulfillment_type !== "PREORDER") return null;
  const text = preorderCopy[language];
  const estimated = item.preorder_estimated_at ? new Date(item.preorder_estimated_at) : null;
  return <div className="my-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" role="status">
    <strong>{text.badge}</strong><p className="mt-1">{text.explanation}</p>
    {estimated && Number.isFinite(estimated.getTime()) && <p>{text.estimated}: {new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(estimated)}</p>}
    {item.preorder_message && <p>{item.preorder_message}</p>}
  </div>;
}
