"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GraduationCap, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
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
          <p className="text-xs text-gray-400">FisioReferentes</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Contraseña actualizada
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Tu nueva contraseña ya está activa. Ya puedes acceder a la plataforma.
              </p>
              <a
                href="/"
                className="inline-block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Acceder a la plataforma
              </a>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Establece tu contraseña
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Introduce tu nueva contraseña para acceder a la plataforma.
              </p>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="mb-4 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  minLength={8}
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
                  {loading ? "Guardando..." : "Guardar contraseña"}
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
