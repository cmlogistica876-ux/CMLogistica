/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { AuditLog } from "../types";
import { ShieldCheck, Search, FileCode, Clock, Mail } from "lucide-react";

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = () => {
    // Reverse logs to show newest first
    setLogs([...DbService.getAuditLogs()].reverse());
  };

  useEffect(() => {
    loadLogs();
    const unsubscribe = DbService.subscribeToDb(loadLogs);
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((l) => {
    return (
      l.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="audit-logs-container">
      {/* Search and List panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-600" /> Trazabilidad & Auditoría de Operación
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Historial inmutable de acciones críticas en RutaTrack.</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuario, acción (ej. Inicio de ruta) o entidad..."
            className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {/* List of logs */}
        <div className="overflow-y-auto max-h-[500px] flex flex-col gap-3 pr-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-purple-900 text-stone-100 border-purple-900"
                      : "bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-purple-800 text-purple-200" : "bg-stone-200/60 text-stone-600"}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{log.action}</h4>
                      <p className={`text-xs mt-0.5 ${isSelected ? "text-stone-300" : "text-stone-600"} flex items-center gap-1`}>
                        <Mail className="w-3 h-3" /> {log.userEmail}
                      </p>
                      <p className={`text-[10px] mt-1 ${isSelected ? "text-stone-400" : "text-stone-400"} font-mono`}>
                        ID Entidad: {log.entityId} • {log.entityType}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-mono block ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? "text-stone-400" : "text-stone-400"}`}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 italic">
              No se encontraron registros de auditoría que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2 border-b border-stone-150 pb-3 mb-4">
          <FileCode className="w-4 h-4 text-stone-500" /> Registro de Datos Crudos
        </h3>

        {selectedLog ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Acción Ejecutada</span>
              <p className="text-sm font-bold text-stone-800 mt-0.5">{selectedLog.action}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Usuario Disparador</span>
              <p className="text-xs text-stone-700 font-medium font-mono mt-0.5 break-all">{selectedLog.userEmail}</p>
              <p className="text-[10px] text-stone-400 font-mono">UID: {selectedLog.userId}</p>
            </div>

            <hr className="border-stone-150" />

            {/* Before state diff display */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Estado Anterior</span>
              {selectedLog.before ? (
                <pre className="text-[10px] font-mono bg-stone-50 text-stone-700 p-3 rounded-lg border border-stone-200 overflow-x-auto mt-1 max-h-[150px]">
                  {JSON.stringify(JSON.parse(selectedLog.before), null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-stone-400 italic mt-1">Sin valor anterior (Creación de registro)</p>
              )}
            </div>

            {/* After state diff display */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Estado Nuevo</span>
              {selectedLog.after ? (
                <pre className="text-[10px] font-mono bg-stone-50 text-stone-700 p-3 rounded-lg border border-stone-200 overflow-x-auto mt-1 max-h-[150px]">
                  {JSON.stringify(JSON.parse(selectedLog.after), null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-stone-400 italic mt-1">Sin valor nuevo (Cierre de sesión/Eliminación)</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-stone-400 italic">
            Selecciona un registro de auditoría a la izquierda para inspeccionar las mutaciones de base de datos asociadas.
          </div>
        )}
      </div>
    </div>
  );
}
