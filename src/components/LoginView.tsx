/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DbService } from "../services/db";
import { Truck, ShieldAlert, Key, User, Eye, EyeOff, CheckCircle } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Por favor ingresa tu usuario y contraseña.");
      setIsLoading(false);
      return;
    }

    try {
      // Small simulated delay to feel professional
      await new Promise((resolve) => setTimeout(resolve, 600));
      await DbService.login(usernameOrEmail.trim(), password.trim());
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans"
      id="login-view-container"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-purple-900 text-stone-100 p-4 rounded-2xl shadow-xl flex items-center justify-center animate-bounce-slow">
            <Truck className="w-10 h-10 text-purple-300" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900 tracking-tight">
          RutaTrack Logística
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 max-w">
          Plataforma de Optimización de Última Milla & Ruteo Inteligente
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-card-wrapper">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-xl sm:px-10 border border-stone-200">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error de Acceso: </span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-150 flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>¡Ingreso correcto! Redirigiendo al panel...</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                Usuario o Correo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="carlos.martinez"
                  disabled={isLoading || success}
                  className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-3 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900 text-stone-800"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading || success}
                  className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-10 py-3 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900 text-stone-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 focus:outline-none"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-purple-900 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-stone-200 border-t-transparent" />
                    Autenticando...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>

          {/* Prompt requested user credentials */}
          <div className="mt-8 border-t border-stone-150 pt-5">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              🔑 Credenciales Requeridas
            </h4>

            <div className="bg-purple-50 rounded-lg border border-purple-100 p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-stone-500 font-medium">Usuario:</span>{" "}
                  <code className="bg-purple-100/60 font-bold px-1.5 py-0.5 rounded text-purple-950 font-mono">
                    carlos.martinez
                  </code>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Contraseña:</span>{" "}
                  <code className="bg-purple-100/60 font-bold px-1.5 py-0.5 rounded text-purple-950 font-mono">
                    Isabella3105
                  </code>
                </div>
              </div>

              <button
                onClick={() => handleFillCredentials("carlos.martinez", "Isabella3105")}
                className="w-full bg-purple-900 hover:bg-purple-850 text-white text-[10px] font-bold py-1.5 px-3 rounded-md transition text-center"
              >
                Auto-completar mis credenciales
              </button>
            </div>

            {/* Other demo accounts block for complete testing */}
            <details className="mt-3">
              <summary className="text-[10px] font-bold text-stone-500 cursor-pointer hover:text-stone-700 select-none">
                Ver otras cuentas de prueba (Roles Dinámicos)
              </summary>
              <div className="mt-2 text-[10px] text-stone-600 bg-stone-50 p-2.5 rounded border border-stone-150 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span>Diana Restrepo (Operativo)</span>
                  <button
                    onClick={() => handleFillCredentials("diana.restrepo", "123456")}
                    className="bg-white hover:bg-stone-100 border text-[9px] font-bold px-2 py-0.5 rounded"
                  >
                    Diana (pass: 123456)
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Andrés Giraldo (Coordinador)</span>
                  <button
                    onClick={() => handleFillCredentials("andres.giraldo", "123456")}
                    className="bg-white hover:bg-stone-100 border text-[9px] font-bold px-2 py-0.5 rounded"
                  >
                    Andrés (pass: 123456)
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mateo Gómez (Conductor)</span>
                  <button
                    onClick={() => handleFillCredentials("mateo.gomez", "123456")}
                    className="bg-white hover:bg-stone-100 border text-[9px] font-bold px-2 py-0.5 rounded"
                  >
                    Mateo (pass: 123456)
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
