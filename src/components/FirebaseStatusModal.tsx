/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DbService } from "../services/db";
import {
  firebaseConfig,
  saveCustomFirebaseConfig,
  FirebaseAppConfig
} from "../services/firebase";
import {
  Flame,
  CheckCircle2,
  RefreshCw,
  Database,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  AlertCircle,
  Settings,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseStatusModal({ isOpen, onClose }: FirebaseStatusModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "custom" | "help">("status");
  const [copied, setCopied] = useState(false);

  // Form for custom credentials if user wants their own project
  const [customProjectId, setCustomProjectId] = useState(firebaseConfig.projectId || "");
  const [customApiKey, setCustomApiKey] = useState(firebaseConfig.apiKey || "");
  const [customAuthDomain, setCustomAuthDomain] = useState(firebaseConfig.authDomain || "");
  const [customDbId, setCustomDbId] = useState(firebaseConfig.firestoreDatabaseId || "(default)");

  if (!isOpen) return null;

  const info = DbService.getFirebaseProjectInfo();

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await DbService.syncAllTablesToFirebase();
      setSyncResult({ success: true, message: res.message });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || "Error al sincronizar tablas con Firebase."
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProjectId.trim() || !customApiKey.trim()) {
      alert("Por favor completa al menos el Project ID y el API Key.");
      return;
    }
    const newConfig: FirebaseAppConfig = {
      projectId: customProjectId.trim(),
      apiKey: customApiKey.trim(),
      authDomain: customAuthDomain.trim() || `${customProjectId.trim()}.firebaseapp.com`,
      firestoreDatabaseId: customDbId.trim() || "(default)",
      appId: firebaseConfig.appId || "custom",
      storageBucket: `${customProjectId.trim()}.firebasestorage.app`
    };
    saveCustomFirebaseConfig(newConfig);
  };

  const handleResetToDefault = () => {
    saveCustomFirebaseConfig(null);
  };

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(info.projectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight">Conexión Firebase Firestore</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Conectado
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5 font-mono">
                Proyecto Activo: <strong className="text-white underline">{info.projectId}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50/80 shrink-0">
          <button
            onClick={() => setActiveTab("status")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === "status"
                ? "border-orange-500 text-orange-700 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Tablas & Estado
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "help"
                ? "border-orange-500 text-orange-700 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ¿Por qué sale el error?
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "custom"
                ? "border-orange-500 text-orange-700 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Conectar mi propio Firebase
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "status" && (
            <>
              {/* Project Details Banner */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 font-mono text-[10px] uppercase font-bold block">Proyecto Cloud Activo</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-stone-900 font-mono text-sm">{info.projectId}</span>
                    <button
                      onClick={handleCopyProjectId}
                      title="Copiar Project ID"
                      className="p-1 hover:bg-stone-200 rounded text-stone-500"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-stone-400 font-mono text-[10px] uppercase font-bold block">Auth Domain</span>
                  <span className="font-mono text-stone-700 truncate block mt-0.5">{info.authDomain}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-mono text-[10px] uppercase font-bold block">Base de Datos Firestore</span>
                  <span className="font-mono text-stone-700 truncate block mt-0.5">
                    {firebaseConfig.firestoreDatabaseId || "(default)"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-mono text-[10px] uppercase font-bold block">Motor de Datos</span>
                  <span className="font-medium text-stone-700 flex items-center gap-1.5 mt-0.5">
                    <Database className="w-3.5 h-3.5 text-amber-500" /> Cloud Firestore (NoSQL)
                  </span>
                </div>
              </div>

              {/* Sync Result Feedback */}
              {syncResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    syncResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-sm">{syncResult.success ? "¡Éxito!" : "Atención"}</p>
                    <p className="mt-0.5">{syncResult.message}</p>
                  </div>
                </div>
              )}

              {/* Tables / Collections List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" />
                      Colecciones en Firestore (10 Módulos)
                    </h4>
                    <p className="text-xs text-stone-500">
                      Colecciones de datos para la operativa logística en tiempo real.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg border border-orange-200">
                    10 Tablas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {info.collections.map((col) => (
                    <div
                      key={col.id}
                      className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between hover:bg-stone-100/80 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          /
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-900 font-mono block truncate">
                            {col.id}
                          </span>
                          <span className="text-[11px] text-stone-500 block truncate">
                            {col.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold bg-white text-stone-700 px-2 py-0.5 rounded-full border border-stone-200">
                          {col.count} {col.count === 1 ? "registro" : "registros"}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "help" && (
            <div className="space-y-4 text-xs text-stone-700">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  ¿Por qué Firebase dice: "El proyecto no existe o no tienes permiso"?
                </h4>
                <p className="leading-relaxed">
                  En Google Cloud, el <strong>Project ID</strong> debe ser único en todo el mundo. Cuando creas un proyecto con el nombre <em>"app-seguimiento-de-rutas"</em>, Firebase casi siempre le añade números al identificador (por ejemplo: <code>app-seguimiento-de-rutas-98a72</code>).
                </p>
                <p className="leading-relaxed">
                  Si escribes o haces clic en una URL que no tiene esos números exactos, Google no encuentra el proyecto y te muestra esa pantalla de error.
                </p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Cómo ver tu proyecto real en tu consola:
                </h5>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    En la pantalla del error, haz clic en el enlace azul{" "}
                    <strong>"regresa a la página principal"</strong> o entra directamente a:{" "}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 font-bold underline inline-flex items-center gap-0.5"
                    >
                      console.firebase.google.com <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>
                    Allí verás la lista de tus proyectos creados bajo <strong>cmlogistica876@gmail.com</strong>.
                  </li>
                  <li>
                    Haz clic en tu proyecto de rutas. Dentro de tu proyecto, en la esquina superior izquierda haz clic en el engranaje ⚙️ <strong>Configuración del proyecto</strong> ➔ pestaña <strong>General</strong>.
                  </li>
                  <li>
                    Allí verás el <strong>"ID del proyecto"</strong> exacto y la clave <strong>apiKey</strong>.
                  </li>
                  <li>
                    Puedes copiar esos datos y pegarlos en la pestaña <strong>"Conectar mi propio Firebase"</strong> de este modal para conectar tu cuenta directamente.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "custom" && (
            <form onSubmit={handleSaveCustom} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                Si deseas que la app guarde los datos directamente en tu propio proyecto personal de Firebase en lugar del aprovisionado en la nube, ingresa tus credenciales aquí (las encuentras en Firebase Console ➔ Configuración del proyecto ⚙️):
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Project ID (Identificador exacto de tu proyecto)
                </label>
                <input
                  type="text"
                  value={customProjectId}
                  onChange={(e) => setCustomProjectId(e.target.value)}
                  placeholder="ej: app-seguimiento-de-rutas-12345"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  API Key de Firebase
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="ej: AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Auth Domain (opcional)
                  </label>
                  <input
                    type="text"
                    value={customAuthDomain}
                    onChange={(e) => setCustomAuthDomain(e.target.value)}
                    placeholder="tuid.firebaseapp.com"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Firestore Database ID
                  </label>
                  <input
                    type="text"
                    value={customDbId}
                    onChange={(e) => setCustomDbId(e.target.value)}
                    placeholder="(default)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Restaurar al proyecto por defecto
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow transition"
                >
                  Guardar & Conectar mi Proyecto
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-stone-500 text-center sm:text-left">
            Las creaciones y ediciones en la app se guardan automáticamente en Firestore.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando Tablas..." : "Crear / Poblar Tablas en Firebase"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
