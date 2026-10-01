/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Delivery, DeliveryStatus, Driver, Client, Route } from "../types";
import { Download, Filter, BarChart3, TrendingUp, Calendar, CheckSquare, Award } from "lucide-react";

export default function ReportsView() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Filter criteria
  const [selectedCity, setSelectedCity] = useState<string>("TODOS");
  const [selectedDriver, setSelectedDriver] = useState<string>("TODOS");
  const [selectedClient, setSelectedClient] = useState<string>("TODOS");
  const [selectedPriority, setSelectedPriority] = useState<string>("TODOS");

  const loadData = () => {
    setDeliveries(DbService.getDeliveries());
    setDrivers(DbService.getDrivers());
    setClients(DbService.getClients());
    setRoutes(DbService.getRoutes());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesCity = selectedCity === "TODOS" || d.city === selectedCity;
    const matchesClient = selectedClient === "TODOS" || d.clientId === selectedClient;
    const matchesPriority = selectedPriority === "TODOS" || d.priority === selectedPriority;

    // Resolve driver mapping from route
    let matchesDriver = true;
    if (selectedDriver !== "TODOS" && d.routeId) {
      const r = routes.find((route) => route.id === d.routeId);
      matchesDriver = r?.driverId === selectedDriver;
    }

    return matchesCity && matchesClient && matchesPriority && matchesDriver;
  });

  // Math Computations for Stats
  const totalCount = filteredDeliveries.length || 1;
  const completedCount = filteredDeliveries.filter((d) => d.status === DeliveryStatus.Entregada).length;
  const failedCount = filteredDeliveries.filter((d) => d.status === DeliveryStatus.Fallida).length;
  const pendingCount = filteredDeliveries.filter(
    (d) => d.status === DeliveryStatus.Asignada || d.status === DeliveryStatus.EnCamino || d.status === DeliveryStatus.EnSitio
  ).length;

  const successRate = Math.round((completedCount / totalCount) * 100);

  // Failure reasons distribution
  const failureReasons = filteredDeliveries
    .filter((d) => d.status === DeliveryStatus.Fallida && d.failureReason)
    .reduce<Record<string, number>>((acc, d) => {
      const reason = d.failureReason || "Otro";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

  // CSV Exporter generator
  const exportToCSV = () => {
    // CSV Header row
    const headers = [
      "CodigoEntrega",
      "Cliente",
      "Direccion",
      "Ciudad",
      "Prioridad",
      "Estado",
      "HoraRecibido",
      "RecibidoPor",
      "IdentificacionRecibido",
      "MotivoFalla",
      "FechaCreacion"
    ];

    const rows = filteredDeliveries.map((d) => {
      const client = clients.find((c) => c.id === d.clientId);
      return [
        `"${d.code}"`,
        `"${client ? client.name.replace(/"/g, '""') : ""}"`,
        `"${d.address.replace(/"/g, '""')}"`,
        `"${d.city}"`,
        `"${d.priority}"`,
        `"${d.status}"`,
        `"${d.deliveredAt || ""}"`,
        `"${d.receivedByName || ""}"`,
        `"${d.receivedByDocument || ""}"`,
        `"${d.failureReason || ""}"`,
        `"${d.createdAt}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RutaTrack_Reporte_Logistico_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6" id="reports-view-container">
      {/* Header action panel */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-stone-600" /> Reportes de Gestión de Despacho
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Analiza tasas de efectividad de entregas por cliente, zona y conductor. Exporta logs a CSV para análisis BI.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-bold text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition border border-purple-800 self-start md:self-auto"
        >
          <Download className="w-4 h-4" /> Exportar Filtro a CSV
        </button>
      </div>

      {/* Grid of Interactive Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Zona / Ciudad</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
          >
            <option value="TODOS">Todas las zonas</option>
            <option value="Bogotá">Bogotá</option>
            <option value="Medellín">Medellín</option>
            <option value="Cali">Cali</option>
            <option value="Barranquilla">Barranquilla</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Cliente Solicitante</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
          >
            <option value="TODOS">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Conductor Asignado</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
          >
            <option value="TODOS">Todos los conductores</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Prioridad del Despacho</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
          >
            <option value="TODOS">Todas</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Grid statistics highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Panel 1 */}
        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Efectividad de Entrega</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-emerald-900 font-mono">{successRate}%</span>
            <p className="text-xs text-emerald-600 mt-1">Porcentaje de entregas completadas con éxito.</p>
          </div>
          <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
            <div style={{ width: `${successRate}%` }} className="bg-emerald-600 h-full rounded-full transition-all duration-500" />
          </div>
        </div>

        {/* KPI Panel 2 */}
        <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">Consolidado Despachos</span>
            <CheckSquare className="w-5 h-5 text-stone-600" />
          </div>
          <div className="my-3 grid grid-cols-3 gap-2">
            <div>
              <span className="text-xl font-bold font-mono text-emerald-700 block">{completedCount}</span>
              <span className="text-[10px] text-stone-500 block">Completos</span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-amber-600 block">{pendingCount}</span>
              <span className="text-[10px] text-stone-500 block">Pendientes</span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-rose-700 block">{failedCount}</span>
              <span className="text-[10px] text-stone-500 block">Fallidos</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400">Total filtrado de {totalCount} órdenes.</p>
        </div>

        {/* Failure motifs chart panel */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Motivos de Falla Operativa</h4>
            <p className="text-[11px] text-stone-400">Distribución de fallas registradas por los transportadores.</p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {Object.keys(failureReasons).length > 0 ? (
              Object.keys(failureReasons).map((reason) => {
                const count = failureReasons[reason];
                const pct = Math.round((count / (failedCount || 1)) * 100);

                return (
                  <div key={reason} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-stone-700">
                      <span>{reason}</span>
                      <span className="font-semibold font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="bg-rose-500 h-full rounded-full" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-stone-400 italic">
                No hay motivos de falla registrados en el conjunto de filtros actual.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
