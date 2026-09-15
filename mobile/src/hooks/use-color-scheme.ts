export function useColorScheme(): "light" | "dark" {
  // The customer app intentionally uses the light storefront presentation.
  // Ignore persisted/device dark preferences so clients cannot switch into it.
  return "light";
}
