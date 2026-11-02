"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import styles from "./StartupScreen.module.css";

const StartupPlaceholder = createContext(false);

export function useStartupPlaceholder() {
  return useContext(StartupPlaceholder);
}

// The root layout keeps this mounted during navigation; only a new document restarts it.
export default function StartupScreen({ children }: { children: ReactNode }) {
  const [covered, setCovered] = useState(true);
  const [placeholder, setPlaceholder] = useState(true);

  useEffect(() => {
    let active = true;
    let revealed = false;
    let placeholderTimer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      if (!active || revealed) return;
      revealed = true;
      setCovered(false);
      // Give the existing skeleton a visible handoff, even with cached sample data.
      placeholderTimer = setTimeout(() => {
        if (active) setPlaceholder(false);
      }, 500);
    };
    // A slow or failed font request must never trap the user here.
    const fallback = setTimeout(reveal, 3000);
    const minimum = new Promise<void>(resolve => setTimeout(resolve, 1200));
    const fonts = document.fonts
      ? document.fonts.load('400 14px "Cairo"', "العربية").then(() => document.fonts.ready).catch(() => undefined)
      : Promise.resolve();

    void Promise.all([minimum, fonts]).then(reveal);

    return () => {
      active = false;
      clearTimeout(fallback);
      clearTimeout(placeholderTimer);
    };
  }, []);

  return (
    <StartupPlaceholder.Provider value={placeholder}>
      <div className={styles.screen} data-covered={covered} aria-hidden={!covered}>
        <div className={styles.brand} role="status" aria-label="MUMKEN — Loading / جارٍ التحميل">
          <Image src="/mumken-logo.svg" alt="MUMKEN" width={234} height={76} loading="eager" unoptimized />
          <span className={styles.indicator} aria-hidden="true" />
        </div>
      </div>
      <div className={styles.content} data-covered={covered}>{children}</div>
      <noscript><style>{`.${styles.screen} { display: none; } .${styles.content} { visibility: visible; }`}</style></noscript>
    </StartupPlaceholder.Provider>
  );
}
