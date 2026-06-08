"use client";
import { useSettings, getWhatsAppHref, getWhatsAppDisplay } from "@/lib/use-settings";

interface WhatsAppLinkProps {
  message?: string;
  className?: string;
  children?: React.ReactNode;
  showNumber?: boolean;
}

export default function WhatsAppLink({ message, className, children, showNumber }: WhatsAppLinkProps) {
  const settings = useSettings();
  const href = getWhatsAppHref(settings, message);
  const display = showNumber ? getWhatsAppDisplay(settings) : null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? display ?? "WhatsApp"}
    </a>
  );
}
