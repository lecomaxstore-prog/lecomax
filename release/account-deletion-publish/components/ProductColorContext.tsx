"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ColorCtx = { color: string; setColor: (c: string) => void };

const ColorContext = createContext<ColorCtx>({ color: "", setColor: () => {} });

export function ProductColorProvider({
  defaultColor,
  children,
}: {
  defaultColor: string;
  children: ReactNode;
}) {
  const [color, setColor] = useState(defaultColor);
  return (
    <ColorContext.Provider value={{ color, setColor }}>
      {children}
    </ColorContext.Provider>
  );
}

export const useProductColor = () => useContext(ColorContext);
