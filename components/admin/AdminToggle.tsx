"use client";
import type { ButtonHTMLAttributes } from 'react';
import styles from './AdminToggle.module.css';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'role' | 'aria-checked'> & {
  checked: boolean; label: string; tone?: 'black' | 'green' | 'yellow' | 'red'; busy?: boolean;
};
export default function AdminToggle({ checked, label, tone = 'black', busy = false, className = '', disabled, ...props }: Props) {
  return <button {...props} type="button" role="switch" aria-checked={checked} aria-label={label} aria-busy={busy || undefined} disabled={disabled || busy} className={`${styles.toggle} ${className}`}>
    <span className={styles.track} data-checked={checked} data-tone={tone}><span className={styles.thumb}>{busy && <span className={styles.spinner} />}</span></span>
  </button>;
}
