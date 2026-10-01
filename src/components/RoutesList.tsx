/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Route, RouteStatus, Driver, Vehicle, Delivery, DeliveryStatus } from "../types";
import { Search, Plus, Edit, ShieldAlert, Navigation, Play, CheckCircle, XCircle } from "lucide-react";

export default function RoutesList() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [name, setName] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [status, setStatus] = useState<RouteStatus>(RouteStatus.Planificada);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setRoutes(DbService.getRoutes());
    setDrivers(DbService.getDrivers());
    setVehicles(DbService.getVehicles());
    setDeliveries(DbService.getDeliveries());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingRoute(null);
    setName("");
    setDriverId(drivers[0]?.id || "");
    setVehicleId(vehicles[0]?.id || "");
    setStatus(RouteStatus.Planificada);
    setSelectedDeliveryIds([]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (route: Route) => {
    setEditingRoute(route);
    setName(route.name);
    setDriverId(route.driverId || "");
    setVehicleId(route.vehicleId || "");
    setStatus(route.status);
    setSelectedDeliveryIds(route.deliveryIds);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleDeliveryCheck = (delId: string) => {
    if (selectedDeliveryIds.includes(delId)) {
      setSelectedDeliveryIds(selectedDeliveryIds.filter((id) => id !== delId));
    } else {
      setSelectedDeliveryIds([...selectedDeliveryIds, delId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name) {
      setFormError("Por favor ingresa un nombre para la ruta.");
      return;
    }

    try {
      if (editingRoute) {
        DbService.updateRoute(editingRoute.id, {
          name,
          driverId: driverId || undefined,
          vehicleId: vehicleId || undefined,
          status,
          deliveryIds: selectedDeliveryIds
        });
      } else {
        DbService.createRoute({
          name,
          driverId: driverId || undefined,
          vehicleId: vehicleId || undefined,
          status,
          deliveryIds: selectedDeliveryIds
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Direct quick action buttons in route list row
  const handleTriggerStatusChange = (routeId: string, nextStatus: RouteStatus) => {
    if (confirm(`¿Estás seguro de cambiar el estado de esta ruta a ${nextStatus}?`)) {
      try {
        DbService.updateRoute(routeId, { status: nextStatus });
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredRoutes = routes.filter((r) => {
    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter deliveries that are unassigned or assigned to this specific editing route
  const availableDeliveries = deliveries.filter(
    (d) => !d.routeId || d.routeId === editingRoute?.id
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="routes-list-container">
      {/* Route List Panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-stone-600" /> Planificador de Rutas de Despacho
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Agrupa despachos, asigna conductores, asocia vehículos e inicia recorridos logísticos.</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition border border-purple-800"
          >
            <Plus className="w-4 h-4" /> Crear Ruta
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código de ruta (RUT-...) o descripción de trayecto..."
            className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50"
          />
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                <th className="py-3 px-4">Ruta / Código</th>
                <th className="py-3 px-4">Asignación Flota</th>
                <th className="py-3 px-4">Entregas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((r) => {
                const driver = drivers.find((d) => d.id === r.driverId);
                const vehicle = vehicles.find((v) => v.id === r.vehicleId);

                let badgeColor = "text-stone-600";
                if (r.status === RouteStatus.EnCurso) badgeColor = "text-emerald-600 font-bold";
                else if (r.status === RouteStatus.Asignada) badgeColor = "text-blue-600";
                else if (r.status === RouteStatus.Finalizada) badgeColor = "text-stone-400";

                return (
                  <tr key={r.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                    <td className="py-3.5 px-4">
                      <div>
                        <strong className="text-stone-800 font-semibold block">{r.name}</strong>
                        <span className="text-[10px] text-stone-400 font-mono block mt-0.5">{r.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      <div>
                        <span className="block">Conductor: <strong>{driver ? driver.name : "S/C"}</strong></span>
                        <span className="block mt-0.5">Placa: <strong className="font-mono">{vehicle ? vehicle.plate : "S/V"}</strong></span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 py-1 px-2.5 rounded-full">
                        {r.deliveryIds.length} despachos
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs ${badgeColor}`}>{r.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1.5 mt-2">
                      {/* Operational trigger buttons */}
                      {r.status === RouteStatus.Asignada && (
                        <button
                          onClick={() => handleTriggerStatusChange(r.id, RouteStatus.EnCurso)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-1.5 rounded-lg border border-emerald-100 text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Iniciar Recorrido"
                        >
                          <Play className="w-3 h-3" /> Iniciar
                        </button>
                      )}

                      {r.status === RouteStatus.EnCurso && (
                        <button
                          onClick={() => handleTriggerStatusChange(r.id, RouteStatus.Finalizada)}
                          className="bg-purple-900 hover:bg-purple-800 text-stone-100 p-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Completar Ruta"
                        >
                          <CheckCircle className="w-3 h-3" /> Finalizar
                        </button>
                      )}

                      {r.status !== RouteStatus.Finalizada && r.status !== RouteStatus.Cancelada && (
                        <button
                          onClick={() => handleTriggerStatusChange(r.id, RouteStatus.Cancelada)}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 p-1.5 rounded-lg border border-rose-150 text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Anular"
                        >
                          <XCircle className="w-3 h-3" /> Cancelar
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="text-stone-700 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 p-1.5 rounded-lg inline-flex items-center transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor sidebar */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        {isFormOpen ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="font-sans font-semibold text-stone-900 text-base border-b border-stone-150 pb-3">
              {editingRoute ? "Configurar Plan de Ruta" : "Diseñar Nueva Ruta"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre / Zona del Trayecto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ruta Bogotá Norte - Unicentro"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Conductor Asignado</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
                  >
                    <option value="">No asignar ninguno</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Camión de Reparto</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
                  >
                    <option value="">No asignar ninguno</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingRoute && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Estado Planificación</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RouteStatus)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50"
                  >
                    {Object.values(RouteStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Checkbox checklist of deliveries */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Empacar Órdenes de Despacho ({selectedDeliveryIds.length})</label>
                <p className="text-[10px] text-stone-400 mb-2">Asigna los siguientes despachos disponibles en zona a este operador.</p>

                <div className="border border-stone-200 rounded-lg bg-stone-50 p-3 flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                  {availableDeliveries.length > 0 ? (
                    availableDeliveries.map((del) => {
                      const checked = selectedDeliveryIds.includes(del.id);
                      return (
                        <label key={del.id} className="flex items-start gap-2.5 text-xs text-stone-700 select-none cursor-pointer hover:bg-stone-100/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleDeliveryCheck(del.id)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-mono font-bold block">{del.code}</span>
                            <span className="text-[10px] text-stone-500 block">{del.address} ({del.city})</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-[10px] text-stone-400 italic">
                      No hay despachos disponibles para empacar. Crea una entrega primero.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-stone-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-lg border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold py-2.5 rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-20 text-xs text-stone-400 italic">
            Selecciona una ruta a la izquierda para cargar despachos, asignar conductores o modificar el estado de tránsito operativo.
          </div>
        )}
      </div>
    </div>
  );
}
