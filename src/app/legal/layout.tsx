import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Academia FisioReferentes
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/legal/aviso-legal" className="text-gray-600 hover:text-gray-900">Aviso Legal</Link>
            <Link href="/legal/privacidad" className="text-gray-600 hover:text-gray-900">Privacidad</Link>
            <Link href="/legal/cookies" className="text-gray-600 hover:text-gray-900">Cookies</Link>
            <Link href="/legal/terminos" className="text-gray-600 hover:text-gray-900">Términos</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} FISIOREFERENTES SL — NIF B56869407 — Zaragoza, España
      </footer>
    </div>
  );
}
