export type ProductBrand = { id: string; name: string; logo: string };

export const brandId = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
export const DEFAULT_BRANDS: ProductBrand[] = [
  { id: "asics", name: "ASICS", logo: "/images/brands/asics.png" },
  { id: "puma", name: "Puma", logo: "/images/brands/puma.png" },
  { id: "adidas", name: "Adidas", logo: "/images/brands/adidas.png" },
  { id: "nike", name: "Nike", logo: "/images/brands/nike.png" },
  { id: "new balance", name: "New Balance", logo: "/images/brands/newbalance.png" },
  { id: "reebok", name: "Reebok", logo: "/images/brands/reebok.png" },
  { id: "under armour", name: "Under Armour", logo: "/images/brands/underarmour.png" },
  { id: "lenovo", name: "Lenovo", logo: "/images/brands/lenovo.png" },
  { id: "sony", name: "Sony", logo: "/images/brands/sony.png" },
  { id: "jordan", name: "Jordan", logo: "/images/brands/jordan.png" },
  { id: "baasploa", name: "Baasploa", logo: "/images/brands/baasploa.png" },
  { id: "genai", name: "GENAI", logo: "/images/brands/genai.png" },
  { id: "kemei", name: "Kemei", logo: "/images/brands/kemei.png" },
  { id: "ellesse", name: "Ellesse", logo: "/images/brands/ellesse.png" },
  { id: "kangol", name: "Kangol", logo: "/images/brands/kangol.png" },
  { id: "joma", name: "Joma", logo: "/images/brands/joma.png" },
  { id: "emporio armani", name: "Emporio Armani", logo: "/images/brands/emporioarmani.png" },
  { id: "fila", name: "Fila", logo: "/images/brands/fila.png" },
  { id: "the north face", name: "The North Face", logo: "/images/brands/thenorthface.png" },
  { id: "zara", name: "Zara", logo: "/images/brands/zara.png" },
  { id: "uniqlo", name: "Uniqlo", logo: "/images/brands/uniqlo.png" },
  { id: "samsung", name: "Samsung", logo: "/images/brands/samsung.png" },
  { id: "apple", name: "Apple", logo: "/images/brands/apple.png" },
  { id: "xiaomi", name: "Xiaomi", logo: "/images/brands/xiaomi.png" },
  { id: "huawei", name: "Huawei", logo: "/images/brands/huawei.png" },
  { id: "hp", name: "HP", logo: "/images/brands/hp.png" },
  { id: "dell", name: "Dell", logo: "/images/brands/dell.png" },
  { id: "asus", name: "ASUS", logo: "/images/brands/asus.png" },
  { id: "acer", name: "Acer", logo: "/images/brands/acer.png" },
  { id: "jbl", name: "JBL", logo: "/images/brands/jbl.png" },
];

export function validateBrand(value: unknown): ProductBrand | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.name !== "string" || typeof input.logo !== "string") return null;
  const name = input.name.normalize("NFKC").trim().replace(/\s+/g, " ");
  const logo = input.logo.trim();
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name) || logo.length > 2048) return null;
  if (logo) {
    try {
      const url = new URL(logo);
      if (url.protocol !== "https:" || url.username || url.password) return null;
    } catch { return null; }
  }
  return { id: brandId(name), name, logo };
}

export function mergeBrands(saved: ProductBrand[], names: (string | null | undefined)[] = []) {
  const brands = new Map(DEFAULT_BRANDS.map(brand => [brand.id, brand]));
  for (const name of names) {
    if (name?.trim() && !brands.has(brandId(name))) {
      brands.set(brandId(name), { id: brandId(name), name: name.trim(), logo: "" });
    }
  }
  for (const brand of saved) brands.set(brandId(brand.name), brand);
  return [...brands.values()].sort((a, b) => a.name.localeCompare(b.name));
}
