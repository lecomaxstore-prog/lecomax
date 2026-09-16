"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { CUSTOMER_SESSION_KEY } from "@/lib/customer-api";
import { GOOGLE_RETURN_KEY, pendingGoogleReturn } from "@/lib/google-auth";
import styles from "@/app/connexion/login.module.css";

export default function GoogleAuthReturn({ callback = false }: { callback?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(callback);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // Recover an OAuth return to the Site URL when Supabase falls back to home.
    // Normal visits and other auth flows (password recovery, email signup) stay untouched.
    if (!callback && (pathname !== "/" || !pendingGoogleReturn())) {
      setActive(false);
      return;
    }
    setActive(true);
    let cancelled = false;
    const destination = pendingGoogleReturn() ?? "/compte";
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const providerError = query.get("error") || hash.get("error");
    const finish = async () => {
      try {
        if (providerError) throw new Error("La connexion Google a été annulée ou refusée. Vous pouvez réessayer.");
        // getSession waits for Supabase's automatic URL processing and persistence.
        // Do not manually exchange the code a second time.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionError || !session) throw new Error("Nous n’avons pas pu finaliser votre connexion. Veuillez réessayer.");
        window.localStorage.setItem(CUSTOMER_SESSION_KEY, "1");
        window.sessionStorage.removeItem(GOOGLE_RETURN_KEY);
        setComplete(true);
        if (!callback && destination === "/") setActive(false);
        router.replace(destination);
      } catch (reason) {
        if (cancelled) return;
        window.sessionStorage.removeItem(GOOGLE_RETURN_KEY);
        // Remove OAuth parameters before the visitor retries or follows a link.
        window.history.replaceState(window.history.state, "", pathname);
        setError(reason instanceof Error ? reason.message : "Connexion impossible. Veuillez réessayer.");
      }
    };
    const timeout = window.setTimeout(() => {
      cancelled = true;
      window.sessionStorage.removeItem(GOOGLE_RETURN_KEY);
      window.history.replaceState(window.history.state, "", pathname);
      setError("La connexion prend plus de temps que prévu. Veuillez réessayer.");
    }, 20000);
    void finish().finally(() => window.clearTimeout(timeout));
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [callback, pathname, router]);

  if (!active || (!callback && pathname !== "/")) return null;
  return (
    <section className={`${styles.page} ${!callback ? styles.returnOverlay : ""}`} aria-label="Connexion Google">
      <div className={styles.panel}>
        <div className={styles.brand}><Logo showWordmark /></div>
        <p className={styles.eyebrow}>CONNEXION AVEC GOOGLE</p>
        <div className={styles.returnEmblem} aria-hidden="true">{error ? "!" : complete ? "✓" : <span className={styles.spinner} />}</div>
        <h1 className={styles.heading}>{error ? "Reprenons ensemble." : complete ? "Vous êtes connecté." : "Un instant, on s’occupe de tout."}</h1>
        <p className={styles.subtitle} role={error ? "alert" : "status"}>{error || (complete ? "Votre espace personnel est prêt." : "Nous finalisons votre connexion à votre espace L’ecomax.")}</p>
        <ol className={styles.authSteps} aria-label="Étapes de connexion">
          <li><span>{error ? "1" : "✓"}</span>Retour de Google</li>
          <li aria-current={!complete ? "step" : undefined}><span>{complete ? "✓" : "2"}</span>Connexion à L’ecomax</li>
          <li aria-current={complete ? "step" : undefined}><span>3</span>Votre espace personnel</li>
        </ol>
        {error && <Link className={styles.submit} href="/connexion">Revenir à la connexion</Link>}
        <p className={styles.support}>Besoin d’aide ? <Link href="/nous-contacter">Contactez-nous</Link></p>
      </div>
    </section>
  );
}
