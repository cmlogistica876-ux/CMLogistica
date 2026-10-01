/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Delivery, DeliveryStatus, Vehicle, VehicleStatus, Incident, IncidentStatus, Route, RouteStatus } from "../types";
import { TrendingUp, Truck, Users, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Activity } from "lucide-react";

interface DashboardProps {
  onNavigateToView: (view: string, targetId?: string) => void;
}

export default function Dashboard({ onNavigateToView }: DashboardProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filterRange, setFilterRange] = useState<"todo" | "anio" | "mes" | "hoy">("todo");

  const loadData = () => {
    setDeliveries(DbService.getDeliveries());
    setVehicles(DbService.getVehicles());
    setIncidents(DbService.getIncidents());
    setRoutes(DbService.getRoutes());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  // Filter deliveries by opening date ("createdAt")
  const filteredDeliveriesByDate = deliveries.filter((d) => {
    if (filterRange === "todo") return true;

    // createdAt e.g. "2026-07-06T14:15:00Z"
    const datePart = d.createdAt ? d.createdAt.substring(0, 10) : "";
    const parts = datePart.split("-");
    if (parts.length !== 3) return true;

    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10); // 1-12
    const itemDay = parseInt(parts[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    if (filterRange === "anio") {
      return itemYear === currentYear;
    }
    if (filterRange === "mes") {
      return itemYear === currentYear && itemMonth === currentMonth;
    }
    if (filterRange === "hoy") {
      return itemYear === currentYear && itemMonth === currentMonth && itemDay === currentDay;
    }
    return true;
  });

  // Filter incidents based on associated deliveries or incident's own creation date
  const filteredIncidents = incidents.filter((inc) => {
    if (inc.deliveryId) {
      return filteredDeliveriesByDate.some((d) => d.id === inc.deliveryId);
    }

    if (filterRange === "todo") return true;

    const datePart = inc.createdAt ? inc.createdAt.substring(0, 10) : "";
    const parts = datePart.split("-");
    if (parts.length !== 3) return true;

    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);
    const itemDay = parseInt(parts[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (filterRange === "anio") {
      return itemYear === currentYear;
    }
    if (filterRange === "mes") {
      return itemYear === currentYear && itemMonth === currentMonth;
    }
    if (filterRange === "hoy") {
      return itemYear === currentYear && itemMonth === currentMonth && itemDay === currentDay;
    }
    return true;
  });

  // Filter routes based on matching deliveries
  const filteredRoutes = routes.filter((r) => {
    if (filterRange === "todo") return true;

    const hasMatchingDelivery = r.deliveryIds.some((id) => filteredDeliveriesByDate.some((d) => d.id === id));
    if (hasMatchingDelivery) return true;

    const datePart = r.createdAt ? r.createdAt.substring(0, 10) : "";
    const parts = datePart.split("-");
    if (parts.length !== 3) return false;

    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);
    const itemDay = parseInt(parts[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (filterRange === "anio") {
      return itemYear === currentYear;
    }
    if (filterRange === "mes") {
      return itemYear === currentYear && itemMonth === currentMonth;
    }
    if (filterRange === "hoy") {
      return itemYear === currentYear && itemMonth === currentMonth && itemDay === currentDay;
    }
    return false;
  });

  // Compute KPIs using filtered data
  const totalToday = filteredDeliveriesByDate.length;
  const completedToday = filteredDeliveriesByDate.filter((d) => d.status === DeliveryStatus.Entregada).length;
  const pendingToday = filteredDeliveriesByDate.filter(
    (d) => d.status === DeliveryStatus.Asignada || d.status === DeliveryStatus.EnCamino || d.status === DeliveryStatus.EnSitio || d.status === DeliveryStatus.Pendiente
  ).length;
  const failedToday = filteredDeliveriesByDate.filter((d) => d.status === DeliveryStatus.Fallida).length;

  const activeRoutesCount = filteredRoutes.filter((r) => r.status === RouteStatus.EnCurso).length;
  const activeVehicles = vehicles.filter((v) => {
    if (v.status !== VehicleStatus.EnRuta) return false;
    return filteredRoutes.some((r) => r.vehicleId === v.id && r.status === RouteStatus.EnCurso);
  }).length;
  const openIncidents = filteredIncidents.filter((i) => i.status === IncidentStatus.Abierto).length;

  // Pie/Bar chart calculation using filtered deliveries
  const statuses = Object.values(DeliveryStatus);
  const statusCounts = statuses.reduce<Record<string, number>>((acc, s) => {
    acc[s] = filteredDeliveriesByDate.filter((d) => d.status === s).length;
    return acc;
  }, {});

  const totalAllTime = filteredDeliveriesByDate.length || 1;
  const recentDeliveries = filteredDeliveriesByDate.slice(0, 5);

  const activeIncidentsList = filteredIncidents
    .filter((i) => i.status === IncidentStatus.Abierto)
    .slice(0, 4);

  const getFilterLabel = () => {
    switch (filterRange) {
      case "todo":
        return "Total";
      case "anio":
        return "Este Año";
      case "mes":
        return "Este Mes";
      case "hoy":
        return "Hoy";
      default:
        return "Total";
    }
  };

  const todayStr = "2026-07-07"; // matches our seed today

  return (
    <div className="flex flex-col gap-6" id="dashboard-container">
      {/* Top Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm" id="dashboard-header">
        <div>
          <h2 className="font-sans font-bold text-stone-900 text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600 animate-pulse" /> Dashboard de Operaciones
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Información consolidada de despachos, vehículos y alertas en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-stone-500">Filtrar por apertura:</span>
          <select
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value as any)}
            className="bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition duration-150"
            id="dashboard-time-filter"
          >
            <option value="todo">Todo</option>
            <option value="anio">Este Año</option>
            <option value="mes">Este mes</option>
            <option value="hoy">Hoy</option>
          </select>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-stone-100 text-stone-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase block tracking-wider">{getFilterLabel()} Programadas</span>
            <span className="text-2xl font-bold font-mono text-stone-900">{totalToday}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Entregas asignadas</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase block tracking-wider">Entregadas</span>
            <span className="text-2xl font-bold font-mono text-emerald-800">{completedToday}</span>
            <span className="text-[10px] text-emerald-500 block mt-0.5">
              {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}% efectividad
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase block tracking-wider">Pendientes</span>
            <span className="text-2xl font-bold font-mono text-blue-800">{pendingToday}</span>
            <span className="text-[10px] text-blue-500 block mt-0.5">En proceso logístico</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-100 text-rose-700">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase block tracking-wider">Fallidas</span>
            <span className="text-2xl font-bold font-mono text-rose-800">{failedToday}</span>
            <span className="text-[10px] text-rose-500 block mt-0.5">Requieren novedad</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-900 border border-purple-800 text-purple-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200">Rutas {filterRange !== "todo" ? "Filtradas" : "en Curso"}</span>
            <span className="text-2xl font-mono font-bold block mt-1 text-white">{activeRoutesCount}</span>
          </div>
          <Truck className="w-8 h-8 text-purple-400" />
        </div>

        <div className="bg-purple-900 border border-purple-800 text-purple-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200">Vehículos {filterRange !== "todo" ? "Activos" : "en Ruta"}</span>
            <span className="text-2xl font-mono font-bold block mt-1 text-white">{activeVehicles}</span>
          </div>
          <Activity className="w-8 h-8 text-purple-400" />
        </div>

        <div className="bg-purple-900 border border-purple-800 text-purple-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200">Alertas {filterRange !== "todo" ? "Filtradas" : "Activas"}</span>
            <span className="text-2xl font-mono font-bold block mt-1 text-rose-300">{openIncidents}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-purple-400" />
        </div>
      </div>

      {/* Charts and Alerts panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom SVG Analytics Chart */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stone-500" /> Distribución de Entregas ({getFilterLabel()})
            </h3>
            <p className="text-xs text-stone-500 mt-1">Conteo consolidado de despachos por estado según el rango seleccionado.</p>
          </div>

          {/* SVG Bar Chart */}
          <div className="my-6 flex items-end justify-between h-[180px] px-4 border-b border-stone-200 relative">
            {Object.keys(statusCounts).map((key) => {
              const count = statusCounts[key];
              const pct = Math.max(8, Math.min(100, (count / totalAllTime) * 100));
              let barColor = "bg-stone-300";
              if (key === DeliveryStatus.Entregada) barColor = "bg-emerald-500";
              else if (key === DeliveryStatus.Fallida) barColor = "bg-rose-500";
              else if (key === DeliveryStatus.EnCamino) barColor = "bg-purple-600";
              else if (key === DeliveryStatus.Asignada) barColor = "bg-blue-400";
              else if (key === DeliveryStatus.Reprogramada) barColor = "bg-amber-500";

              return (
                <div key={key} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-xs font-mono font-bold text-stone-700 opacity-0 group-hover:opacity-100 transition absolute -top-6 bg-stone-950 text-stone-50 py-0.5 px-2 rounded-md text-[10px]">
                    {count}
                  </span>
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-10 rounded-t-lg ${barColor} shadow-sm transition-all duration-500 hover:brightness-95 cursor-pointer relative`}
                  />
                  <span className="text-[9px] text-stone-500 font-medium truncate max-w-[65px] text-center" title={key}>
                    {key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Alerts / Open Incidents Panel */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-stone-500" /> Novedades Activas ({getFilterLabel()})
            </h3>
            <p className="text-xs text-stone-500 mt-1">Novedades reportadas en tiempo real para las órdenes seleccionadas.</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 my-4 overflow-y-auto max-h-[190px]">
            {activeIncidentsList.length > 0 ? (
              activeIncidentsList.map((inc) => {
                const driver = DbService.getDrivers().find((d) => d.id === inc.driverId);
                const vehicle = DbService.getVehicles().find((v) => v.id === inc.vehicleId);

                return (
                  <div key={inc.id} className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex gap-2">
                    <div className="text-rose-500 mt-0.5 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-rose-800">{inc.type}</span>
                        <span className="text-[9px] text-rose-400 font-mono">
                          {vehicle ? vehicle.plate : "S/P"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed mt-1">
                        {inc.description}
                      </p>
                      <span className="text-[9px] text-stone-400 mt-1 block">
                        Por: {driver ? driver.name : "Conductor"} • {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-xl">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <p className="text-xs text-stone-500 mt-2 font-medium">Operación limpia</p>
                <p className="text-[11px] text-stone-400">No hay alertas de novedad para este rango de fecha.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToView("MAPA")}
            className="w-full text-center text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg transition border border-stone-200"
          >
            Ver Mapa de Operación
          </button>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-base">
              {filterRange === "hoy"
                ? "Entregas del Día (Hoy)"
                : filterRange === "mes"
                ? "Entregas de este Mes"
                : filterRange === "anio"
                ? "Entregas de este Año"
                : "Historial de Todas las Entregas"}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {filterRange === "hoy"
                ? `Estado de despachos logísticos creados hoy.`
                : filterRange === "mes"
                ? "Despachos logísticos con fecha de apertura en el mes actual."
                : filterRange === "anio"
                ? "Despachos logísticos con fecha de apertura en el año actual."
                : "Lista completa de despachos registrados en el sistema."}
            </p>
          </div>
          <button
            onClick={() => onNavigateToView("ENTREGAS")}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
          >
            Gestionar Entregas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentDeliveries.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Ciudad</th>
                  <th className="py-3 px-4">Apertura</th>
                  <th className="py-3 px-4">Ventana Horaria</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((del) => {
                  const client = DbService.getClients().find((c) => c.id === del.clientId);

                  let badgeColor = "bg-stone-100 text-stone-800";
                  if (del.status === DeliveryStatus.Entregada) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (del.status === DeliveryStatus.Fallida) badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                  else if (del.status === DeliveryStatus.EnCamino) badgeColor = "bg-purple-50 text-purple-700 border-purple-100";
                  else if (del.status === DeliveryStatus.Asignada) badgeColor = "bg-blue-50 text-blue-700 border-blue-100";

                  const formattedApertura = del.createdAt ? del.createdAt.substring(0, 10) : "";

                  return (
                    <tr key={del.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-900">{del.code}</td>
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {client ? client.name : "Cargando..."}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 truncate max-w-[200px]" title={del.address}>
                        {del.address}
                      </td>
                      <td className="py-3.5 px-4 text-stone-50">{del.city}</td>
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">{formattedApertura}</td>
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">
                        {del.timeWindowStart} - {del.timeWindowEnd}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            del.priority === "Alta"
                              ? "bg-rose-100 text-rose-700"
                              : del.priority === "Media"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {del.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold py-1 px-2 rounded-full border ${badgeColor}`}>
                          {del.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onNavigateToView("ENTREGA_DETALLE", del.id)}
                          className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-3 rounded-lg border border-stone-200 transition"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-sm text-stone-400 italic">
              No hay órdenes registradas para el período seleccionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
