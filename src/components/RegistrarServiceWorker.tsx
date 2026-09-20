"use client";

import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // instalabilidade PWA é um bônus, não deve quebrar o app se falhar
      });
    }
  }, []);

  return null;
}
