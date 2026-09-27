import { shippingConfigFromSettings } from "./shipping-config.ts";
import { resolveShippingQuote, type ShippingZoneRule } from "./shipping-zones.ts";

/** Give the assistant checkout's effective rules, not raw administrative rows. */
export function assistantShippingFacts(settings: Record<string, string>, zones: ShippingZoneRule[]) {
  const config = shippingConfigFromSettings(settings);
  const quoteFor = (city: string) => {
    const quote = resolveShippingQuote(city, 0, zones, config);
    return { price: quote.cost, freeThreshold: quote.freeThreshold, estimatedDays: quote.estimatedDays };
  };
  const cities = [...new Set(zones.filter(zone => zone.active).flatMap(zone => zone.cities ?? []))];
  return {
    currency: settings.currency,
    freeShippingEnabled: config.freeShippingEnabled !== false,
    national: quoteFor(""),
    cities: cities.map(city => ({ city, ...quoteFor(city) })),
  };
}
