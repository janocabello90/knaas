import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/legal/cookie-banner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Academia | FisioReferentes",
  description: "Academia de FisioReferentes - Plataforma de mentoring para fisioterapeutas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
