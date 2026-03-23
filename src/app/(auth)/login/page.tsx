"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KNAAS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Knowledge Navigator & Adaptive Assistance System
          </p>
          <p className="text-xs text-gray-400">FisioReferentes</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Revisa tu email</h2>
              <p className="mt-2 text-sm text-gray-500">
                Hemos enviado un enlace de acceso a <strong>{email}</strong>.
                Haz clic en el enlace para entrar.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Accede a tu cuenta</h2>
              <p className="mb-6 text-sm text-gray-500">
                Te enviaremos un enlace mágico a tu email
              </p>

              <form onSubmit={handleLogin}>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="mb-4 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {error && (
                  <p className="mb-4 text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar enlace de acceso"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          De Fisio a Empresario &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
