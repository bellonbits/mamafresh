"use client";

import { useCallback, useEffect, useState } from "react";

export type CookieConsent = "unset" | "accepted" | "declined";

export const COOKIE_CONSENT_KEY = "mamafresh-cookie-consent";

/** Reads the stored consent choice outside React state — safe to call from any effect. */
export function getStoredCookieConsent(): CookieConsent {
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored === "accepted" || stored === "declined" ? stored : "unset";
  } catch {
    return "unset";
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>("unset");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setConsent(getStoredCookieConsent());
      setReady(true);
    });
  }, []);

  const accept = useCallback(() => {
    try { window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted"); } catch { /* private mode, etc. */ }
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    try { window.localStorage.setItem(COOKIE_CONSENT_KEY, "declined"); } catch { /* private mode, etc. */ }
    setConsent("declined");
  }, []);

  return { consent, ready, accept, decline };
}
