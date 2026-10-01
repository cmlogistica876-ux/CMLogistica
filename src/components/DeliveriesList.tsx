/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Delivery, DeliveryStatus, Client, Route } from "../types";
import { Search, Plus, Edit, ShieldAlert, Package, MapPin } from "lucide-react";

interface DeliveriesListProps {
  onNavigateToDetail: (deliveryId: string) => void;
}

export default function DeliveriesList({ onNavigateToDetail }: DeliveriesListProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("Bogotá");
  const [scheduledDate, setScheduledDate] = useState<string>("2026-07-07");
  const [timeWindowStart, setTimeWindowStart] = useState<string>("08:00");
  const [timeWindowEnd, setTimeWindowEnd] = useState<string>("12:00");
  const [status, setStatus] = useState<DeliveryStatus>(DeliveryStatus.Pendiente);
  const [priority, setPriority] = useState<"Baja" | "Media" | "Alta">("Media");
  const [notes, setNotes] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  // Quick Client states
  const [isQuickClientOpen, setIsQuickClientOpen] = useState<boolean>(false);
  const [quickClientName, setQuickClientName] = useState<string>("");
  const [quickClientTaxId, setQuickClientTaxId] = useState<string>("");
  const [quickClientAddress, setQuickClientAddress] = useState<string>("");
  const [quickClientContactName, setQuickClientContactName] = useState<string>("");
  const [quickClientContactEmail, setQuickClientContactEmail] = useState<string>("");
  const [quickClientError, setQuickClientError] = useState<string | null>(null);

  const handleCreateQuickClient = (e: React.MouseEvent) => {
    e.preventDefault();
    setQuickClientError(null);

    if (!quickClientName || !quickClientTaxId || !quickClientAddress || !quickClientContactName || !quickClientContactEmail) {
      setQuickClientError("Por favor ingresa los campos obligatorios del cliente.");
      return;
    }

    try {
      const newClient = DbService.createClient({
        name: quickClientName,
        taxId: quickClientTaxId,
        address: quickClientAddress,
        city: city || "Bogotá",
        contactName: quickClientContactName,
        contactPhone: "",
        contactEmail: quickClientContactEmail,
        status: "Activo" as any
      });

      // Reload clients
      const updatedClients = DbService.getClients();
      setClients(updatedClients);
      setClientId(newClient.id);

      // Reset quick client fields
      setQuickClientName("");
      setQuickClientTaxId("");
      setQuickClientAddress("");
      setQuickClientContactName("");
      setQuickClientContactEmail("");
      setIsQuickClientOpen(false);
    } catch (err: any) {
      setQuickClientError(err.message || "Error al registrar cliente.");
    }
  };

  const loadData = () => {
    setDeliveries(DbService.getDeliveries());
    setClients(DbService.getClients());
    setRoutes(DbService.getRoutes());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingDelivery(null);
    setClientId(clients[0]?.id || "");
    setRouteId("");
    setAddress("");
    setCity("Bogotá");
    setScheduledDate("2026-07-07");
    setTimeWindowStart("08:00");
    setTimeWindowEnd("12:00");
    setStatus(DeliveryStatus.Pendiente);
    setPriority("Media");
    setNotes("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (del: Delivery) => {
    setEditingDelivery(del);
    setClientId(del.clientId);
    setRouteId(del.routeId || "");
    setAddress(del.address);
    setCity(del.city);
    setScheduledDate(del.scheduledDate);
    setTimeWindowStart(del.timeWindowStart);
    setTimeWindowEnd(del.timeWindowEnd);
    setStatus(del.status);
    setPriority(del.priority);
    setNotes(del.notes || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientId || !address || !scheduledDate) {
      setFormError("Por favor ingresa los campos obligatorios.");
      return;
    }

    // Coordinates mapping depending on selected Colombian cities
    const coordsMap: Record<string, { lat: number; lng: number }> = {
      "Bogotá": { lat: 4.6540, lng: -74.1100 },
      "Medellín": { lat: 6.2020, lng: -75.5720 },
      "Cali": { lat: 3.4400, lng: -76.5200 },
      "Barranquilla": { lat: 10.9990, lng: -74.8110 }
    };
    const location = coordsMap[city] || { lat: 4.7110, lng: -74.0721 };

    try {
      if (editingDelivery) {
        DbService.updateDelivery(editingDelivery.id, {
          clientId,
          routeId: routeId || undefined,
          address,
          city,
          location,
          scheduledDate,
          timeWindowStart,
          timeWindowEnd,
          status,
          priority,
          notes: notes || undefined
        });
      } else {
        DbService.createDelivery({
          clientId,
          routeId: routeId || undefined,
          address,
          city,
          location,
          scheduledDate,
          timeWindowStart,
          timeWindowEnd,
          status,
          priority,
          notes: notes || undefined
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const client = clients.find((c) => c.id === d.clientId);
    const clientName = client ? client.name : "";

    const matchesSearch =
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "TODOS" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`grid grid-cols-1 ${isFormOpen ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-6`} id="deliveries-list-container">
      {/* Table grid List */}
      <div className={`${isFormOpen ? "lg:col-span-2" : "lg:col-span-1"} bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-stone-600" /> Control de Despachos / Entregas
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Controla las órdenes, estados de entrega de última milla, prioridades y ventanas.</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition border border-purple-800"
          >
            <Plus className="w-4 h-4" /> Crear Entrega
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, cliente o dirección..."
              className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none min-w-[150px]"
          >
            <option value="TODOS">Todos los estados</option>
            {Object.values(DeliveryStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Fecha & Ventana</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((d) => {
                const client = clients.find((c) => c.id === d.clientId);
                const isFinished = d.status === DeliveryStatus.Entregada || d.status === DeliveryStatus.Fallida;

                let badgeColor = "text-stone-600";
                if (d.status === DeliveryStatus.Entregada) badgeColor = "text-emerald-600";
                else if (d.status === DeliveryStatus.Fallida) badgeColor = "text-rose-600";
                else if (d.status === DeliveryStatus.EnCamino) badgeColor = "text-purple-600";

                return (
                  <tr key={d.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{d.code}</td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      {client ? client.name : "..."}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="text-xs">
                        <span className="block font-medium text-stone-700">{d.address}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{d.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="text-[11px] font-mono">
                        <span className="block">{d.scheduledDate}</span>
                        <span className="text-stone-400">{d.timeWindowStart} - {d.timeWindowEnd}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold ${badgeColor}`}>{d.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigateToDetail(d.id)}
                        className="text-purple-600 hover:text-purple-700 font-semibold text-xs py-1 px-2.5 bg-purple-50 border border-purple-100 rounded-lg transition"
                      >
                        Ficha
                      </button>

                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="text-stone-700 hover:text-stone-900 font-semibold text-xs border border-stone-200 hover:bg-stone-50 p-1 rounded-lg transition"
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
      {isFormOpen && (
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="font-sans font-semibold text-stone-900 text-base border-b border-stone-150 pb-3">
              {editingDelivery ? "Modificar Entrega" : "Crear Nueva Entrega"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">Cliente Solicitante *</label>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(!isQuickClientOpen)}
                    className="text-[11px] text-purple-900 hover:text-purple-700 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> {isQuickClientOpen ? "Cerrar" : "+ Nuevo cliente"}
                  </button>
                </div>

                {isQuickClientOpen ? (
                  <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 flex flex-col gap-2.5 mb-3 mt-1 animate-fade-in">
                    <p className="text-[11px] font-bold text-purple-950 uppercase tracking-wider">Registrar Cliente Rápido</p>
                    
                    {quickClientError && (
                      <p className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 font-medium">
                        {quickClientError}
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Razón Social (ej. Éxito S.A.) *"
                        value={quickClientName}
                        onChange={(e) => setQuickClientName(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded p-2 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="NIT (ej. 890.900.608-9) *"
                        value={quickClientTaxId}
                        onChange={(e) => setQuickClientTaxId(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded p-2 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Dirección Principal *"
                        value={quickClientAddress}
                        onChange={(e) => setQuickClientAddress(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded p-2 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Contacto de Logística *"
                        value={quickClientContactName}
                        onChange={(e) => setQuickClientContactName(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded p-2 bg-white"
                      />
                      <input
                        type="email"
                        placeholder="Correo Electrónico *"
                        value={quickClientContactEmail}
                        onChange={(e) => setQuickClientContactEmail(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded p-2 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setIsQuickClientOpen(false)}
                        className="flex-1 bg-white hover:bg-stone-50 border text-stone-700 text-[11px] py-1.5 rounded font-medium transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateQuickClient}
                        className="flex-1 bg-purple-900 hover:bg-purple-800 text-stone-100 text-[11px] py-1.5 rounded font-bold transition"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Ciudad Destino *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                >
                  <option value="Bogotá">Bogotá</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Dirección de Entrega *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle 26 # 69-76, Edificio Elemento"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Fecha Programada *</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Ventana Inicia</label>
                  <input
                    type="text"
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                    placeholder="08:00"
                    className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-stone-50 text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Ventana Fin</label>
                  <input
                    type="text"
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                    placeholder="12:00"
                    className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-stone-50 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Ruta Vinculada (Opcional)</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                >
                  <option value="">Sin ruta vinculada</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Estado Entrega</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2 bg-stone-50"
                  >
                    {Object.values(DeliveryStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Observaciones / Indicaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales para el transportador..."
                  className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-stone-50 focus:outline-none"
                />
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
        </div>
      )}
    </div>
  );
}
