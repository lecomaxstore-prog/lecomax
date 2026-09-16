const listeners = new Set<() => void>();
let openMenus = 0;

export function subscribeSizeMenu(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const isSizeMenuOpen = () => openMenus > 0;
export const sizeMenuServerSnapshot = () => false;

export function registerOpenSizeMenu() {
  openMenus += 1;
  listeners.forEach((listener) => listener());
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openMenus -= 1;
    listeners.forEach((listener) => listener());
  };
}
