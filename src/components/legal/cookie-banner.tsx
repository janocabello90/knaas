"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CookieChoice = "accepted" | "rejected" | null;

function getCookieConsent(): CookieChoice {
  if (typeof window === "undefined") return null;
  const v = document.cookie.split("; ").find((c) => c.startsWith("cookie_consent="));
  if (!v) return null;
  return v.split("=")[1] as CookieChoice;
}

function setCookieConsent(value: "accepted" | "rejected") {
  document.cookie = `cookie_consent=${value}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (choice: "accepted" | "rejected") => {
    setCookieConsent(choice);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">
          <p>
            Utilizamos cookies esenciales para el funcionamiento de la plataforma.
            Actualmente no usamos cookies analíticas ni de marketing.
            Puedes consultar nuestra{" "}
            <Link href="/legal/cookies" className="font-medium text-blue-600 underline">
              Política de Cookies
            </Link>{" "}
            y nuestra{" "}
            <Link href="/legal/privacidad" className="font-medium text-blue-600 underline">
              Política de Privacidad
            </Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => handle("rejected")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Rechazar todo
          </button>
          <button
            onClick={() => handle("accepted")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
