import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        <div className={styles.art} aria-hidden="true">
          <span className={styles.orbit} />
          <span className={styles.number}>404</span>
          <span className={styles.spark}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
        <div className={styles.content}>
          <p className={styles.eyebrow}>L’ECOMAX <span /> Erreur 404</p>
          <h1 id="not-found-title" className={styles.title}>Page introuvable.</h1>
          <p className={styles.description}>
            Le lien a peut-être changé.<br />
            Retrouvez toutes nos découvertes depuis l’accueil.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>
              <span className={styles.homeIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span>Retour à l’accueil</span>
              <svg className={styles.primaryArrow} aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link href="/boutique" className={styles.secondary}>
              Découvrir la boutique
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
