import { msg } from "@/i18n";
import { supabase } from "@/lib/supabase";
import type { SavedAddress } from "@/stores/user";

type WebsiteAddress = {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  zip?: string;
  country?: string;
  phone: string;
  isDefault: boolean;
};

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function fromWebsite(value: unknown, email: string): SavedAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const address = value as Partial<WebsiteAddress>;
  const id = clean(address.id, 80);
  const name = clean(address.fullName, 100);
  const phone = clean(address.phone, 30);
  const city = clean(address.city, 100);
  const line = [clean(address.line1, 220), clean(address.line2, 120), clean(address.zip, 20)]
    .filter(Boolean)
    .join(", ");
  if (!id || !name || !phone || !city || !line) return null;
  return { id, name, email, phone, city, address: line };
}

function toWebsite(address: SavedAddress, isDefault: boolean): WebsiteAddress {
  return {
    id: address.id,
    label: isDefault ? "Adresse principale" : "Adresse",
    fullName: address.name,
    line1: address.address,
    line2: "",
    city: address.city,
    zip: "",
    country: "Maroc",
    phone: address.phone,
    isDefault,
  };
}

export async function loadAccountAddresses() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(msg("apiClient.yourSessionHasExpiredSignInAgain"));
  const email = data.user.email ?? "";
  const values = Array.isArray(data.user.user_metadata?.addresses)
    ? data.user.user_metadata.addresses
    : [];
  const addresses = values
    .map((value) => fromWebsite(value, email))
    .filter((value): value is SavedAddress => Boolean(value));
  const defaultValue = values.find((value) =>
    value && typeof value === "object" && !Array.isArray(value) && value.isDefault === true
  ) as Partial<WebsiteAddress> | undefined;
  return { addresses, defaultId: clean(defaultValue?.id, 80) || addresses[0]?.id || null };
}

export async function saveAccountAddresses(addresses: SavedAddress[], selectedAddressId: string | null) {
  const normalized = addresses.slice(0, 10).map((address) =>
    toWebsite(address, address.id === selectedAddressId),
  );
  const { error } = await supabase.auth.updateUser({ data: { addresses: normalized } });
  if (error) throw new Error(msg("addresses.unableToSyncYourAddresses"));
}
