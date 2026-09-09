export { getPurchasability, selectedInventory, preorderSnapshot } from "../mobile/src/lib/purchasability";
export type { PreorderFields, PreorderSnapshot, FulfillmentType } from "../mobile/src/lib/purchasability";
import { getPurchasability, selectedInventory, preorderSnapshot } from "../mobile/src/lib/purchasability";

export function databaseAvailability(product: Record<string, unknown>, item: { color?: string; size?: string; quantity: number }) {
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const colorStock = product.color_stock && typeof product.color_stock === "object" && !Array.isArray(product.color_stock)
    ? Object.fromEntries(Object.entries(product.color_stock).map(([k,v]) => [k,Number(v)])) : undefined;
  const stock = selectedInventory({ stock: Number(product.stock), colors: strings(product.colors), sizes: strings(product.sizes), tags: strings(product.tags), color_stock: colorStock },item.color,item.size);
  const metadata = { preorder_enabled: product.preorder_enabled === true, preorder_estimated_at: typeof product.preorder_estimated_at === "string" ? product.preorder_estimated_at : null, preorder_message: typeof product.preorder_message === "string" ? product.preorder_message : null };
  return { availableQuantity: stock, status: stock < 0 ? "INVALID_VARIANT" : getPurchasability(stock,metadata.preorder_enabled,item.quantity), ...preorderSnapshot(metadata,stock,item.quantity) };
}
