"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      window.location.href = "/";
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
          <h1 className="text-2xl font-bold text-gray-900">Academia</h1>
          <p className="mt-1 text-sm text-gray-500">
            Plataforma de mentoring para fisioterapeutas
          </p>
          <p className="text-xs text-gray-400">FisioReferentes</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Accede a tu cuenta</h2>
          <p className="mb-6 text-sm text-gray-500">
            Introduce tu email y contraseña
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

            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
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
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Introduce tu email primero");
                  return;
                }
                setLoading(true);
                setError("");
                const supabase = createSupabaseBrowserClient();
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
                });
                if (resetError) {
                  setError(resetError.message);
                } else {
                  setError("");
                  alert("Te hemos enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.");
                }
                setLoading(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          De Fisio a Empresario &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
