"use client";

import { useEffect, useState } from "react";

export default function LowStockReveal({ stock }: { stock: number | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (stock === null || stock <= 0 || stock > 5) return;
    const reveal = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-product-selection]")) {
        setVisible(true);
      }
    };
    document.addEventListener("click", reveal);
    return () => document.removeEventListener("click", reveal);
  }, [stock]);

  if (!visible || stock === null || stock <= 0 || stock > 5) return null;

  return (
    <span role="status" className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap pt-1 text-center text-[12px] font-semibold text-red-600 sm:w-auto sm:justify-start sm:pt-0 sm:text-left">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Plus que {stock} {stock === 1 ? "article" : "articles"} en stock
    </span>
  );
}
