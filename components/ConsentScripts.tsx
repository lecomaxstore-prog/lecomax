"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type Consent = {
  analytics?: boolean;
};

function readAnalyticsConsent() {
  try {
    const raw = localStorage.getItem("lecomax_cookie_consent");
    return raw ? JSON.parse(raw)?.analytics === true : false;
  } catch {
    return false;
  }
}

export default function ConsentScripts() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readAnalyticsConsent());
    const onConsent = (event: Event) => {
      const granted = Boolean((event as CustomEvent<Consent>).detail?.analytics);
      setEnabled(granted);
      const analyticsWindow = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        clarity?: (...args: unknown[]) => void;
      };
      analyticsWindow.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
      analyticsWindow.clarity?.("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: granted ? "granted" : "denied",
      });
    };
    window.addEventListener("lecomax-consent-change", onConsent);
    return () => window.removeEventListener("lecomax-consent-change", onConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-9N1CPZQ1HG" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        gtag('config', 'G-9N1CPZQ1HG', { page_path: window.location.pathname });
      `}</Script>
      <Script id="clarity-init" strategy="lazyOnload">{`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","x510dwwy6k");
        window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      `}</Script>
    </>
  );
}
