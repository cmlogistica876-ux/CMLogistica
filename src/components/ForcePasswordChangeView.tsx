/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DbService } from "../services/db";
import { User } from "../types";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle, Truck, RefreshCw } from "lucide-react";

interface ForcePasswordChangeViewProps {
  currentUser: User;
  onPasswordChanged: () => void;
}

export default function ForcePasswordChangeView({
  currentUser,
  onPasswordChanged
}: ForcePasswordChangeViewProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = newPassword.trim();
    if (!trimmedPassword) {
      setError("La contraseña no puede estar vacía.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres por seguridad.");
      return;
    }

    if (trimmedPassword === currentUser.password) {
      setError("La nueva contraseña debe ser diferente a la contraseña temporal actual.");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setIsLoading(true);
    try {
      // Small simulated delay for enterprise/secure feel
      await new Promise((resolve) => setTimeout(resolve, 800));
      DbService.changePassword(currentUser.uid, trimmedPassword);
      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans"
      id="force-password-change-container"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-purple-900 text-stone-100 p-4 rounded-2xl shadow-xl flex items-center justify-center animate-pulse">
            <Lock className="w-10 h-10 text-purple-300" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-stone-900 tracking-tight px-4">
          Actualización Obligatoria de Seguridad
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 px-6">
          Hola <span className="font-bold text-stone-700">{currentUser.displayName}</span>. Como es tu primer ingreso o tu administrador restableció tus credenciales, debes configurar una contraseña privada y segura para continuar.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="password-change-card-wrapper">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-xl sm:px-10 border border-stone-200">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Seguridad: </span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-150 flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">¡Contraseña Guardada!</span> Tu cuenta ha sido activada correctamente. Redirigiendo...
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  id="new-password"
                  name="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading || success}
                  className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-10 py-3 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900 text-stone-800 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  disabled={isLoading || success}
                  className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-10 py-3 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900 text-stone-800 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-stone-50 rounded-lg p-3 border border-stone-150 text-[11px] text-stone-500 space-y-1">
              <span className="font-bold text-stone-700 block mb-0.5">Requisitos para tu contraseña:</span>
              <p>• Debe tener al menos 6 caracteres.</p>
              <p>• Debe ser distinta a la contraseña temporal actual.</p>
              <p>• Asegúrate de recordarla para tus futuros accesos.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  DbService.logout();
                  window.location.reload();
                }}
                disabled={isLoading || success}
                className="w-1/3 flex justify-center py-3 px-4 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 focus:outline-none transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-purple-900 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin h-4 w-4" />
                    Actualizando...
                  </span>
                ) : (
                  "Establecer Contraseña"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
