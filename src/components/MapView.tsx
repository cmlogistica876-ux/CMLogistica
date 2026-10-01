/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Vehicle, Route, RouteStatus, Driver, Client, Delivery, DeliveryStatus } from "../types";
import {
  Package, ClipboardCheck, Truck, MapPin, CheckCircle2, XCircle, AlertCircle,
  Calendar, Search, Sparkles, Clock, QrCode, ArrowRight, ChevronRight, RefreshCw,
  User, FileText, Phone, ShieldAlert, CheckCircle, Ban, RefreshCcw
} from "lucide-react";

export default function MapView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Load database entities
  const loadData = () => {
    setVehicles(DbService.getVehicles());
    setRoutes(DbService.getRoutes());
    setDrivers(DbService.getDrivers());
    setClients(DbService.getClients());
    
    const dels = DbService.getDeliveries();
    setDeliveries(dels);

    // Keep selected delivery state updated
    if (selectedDelivery) {
      const updatedDel = dels.find(d => d.id === selectedDelivery.id);
      if (updatedDel) {
        setSelectedDelivery(updatedDel);
      }
    } else if (dels.length > 0 && !selectedDelivery) {
      // Auto-select first delivery for immediate showcase
      setSelectedDelivery(dels[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, [selectedDelivery?.id]);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus = statusFilter === "TODOS" || d.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Transition simulation handlers for selected Delivery
  const handleSimulateNextStep = (d: Delivery) => {
    let nextStatus: DeliveryStatus | null = null;
    const updates: Partial<Delivery> = {};

    switch (d.status) {
      case DeliveryStatus.Pendiente:
        nextStatus = DeliveryStatus.Asignada;
        // Auto assign to a running route if available
        if (!d.routeId) {
          const activeRoute = routes.find(r => r.status === RouteStatus.EnCurso || r.status === RouteStatus.Asignada);
          if (activeRoute) {
            updates.routeId = activeRoute.id;
          } else if (routes.length > 0) {
            updates.routeId = routes[0].id;
          }
        }
        break;
      case DeliveryStatus.Asignada:
        nextStatus = DeliveryStatus.EnCamino;
        break;
      case DeliveryStatus.EnCamino:
        nextStatus = DeliveryStatus.EnSitio;
        break;
      case DeliveryStatus.EnSitio:
        nextStatus = DeliveryStatus.Entregada;
        updates.deliveredAt = new Date().toISOString();
        updates.receivedByName = "María Camila Ortega";
        updates.receivedByDocument = "CC 1.094.882.112";
        break;
      case DeliveryStatus.Fallida:
        nextStatus = DeliveryStatus.Reprogramada;
        break;
      case DeliveryStatus.Reprogramada:
        nextStatus = DeliveryStatus.Pendiente;
        break;
      default:
        break;
    }

    if (nextStatus) {
      try {
        updates.status = nextStatus;
        const updated = DbService.updateDelivery(d.id, updates);
        setSelectedDelivery(updated);
        loadData();
      } catch (err: any) {
        alert("Error de simulación: " + err.message);
      }
    }
  };

  const handleSimulateFailure = (d: Delivery) => {
    try {
      const updated = DbService.updateDelivery(d.id, {
        status: DeliveryStatus.Fallida,
        failureReason: "Cliente ausente en dirección registrada"
      });
      setSelectedDelivery(updated);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleResetDelivery = (d: Delivery) => {
    const dels = DbService.getDeliveries();
    const idx = dels.findIndex(del => del.id === d.id);
    if (idx !== -1) {
      dels[idx].status = DeliveryStatus.Pendiente;
      dels[idx].deliveredAt = undefined;
      dels[idx].receivedByName = undefined;
      dels[idx].receivedByDocument = undefined;
      dels[idx].failureReason = undefined;
      dels[idx].updatedAt = new Date().toISOString();
      DbService.saveDeliveries(dels);
      
      setSelectedDelivery(dels[idx]);
      loadData();
    }
  };

  // Help calculate Route, Driver, Vehicle for delivery steps
  const getDeliveryRouteDetails = (d: Delivery) => {
    const route = routes.find((r) => r.id === d.routeId);
    const driver = drivers.find((drv) => drv.id === route?.driverId);
    const vehicle = vehicles.find((v) => v.id === route?.vehicleId);
    return {
      routeName: route?.name || "Ruta de reparto express",
      driverName: driver?.name || "Juan Carlos Giraldo",
      driverPhone: driver?.phone || "+57 312 455 8890",
      vehiclePlate: vehicle?.plate || "SZX-980",
      vehicleType: vehicle?.type || "Furgón Turbo"
    };
  };

  // Generate beautiful chronological tracking steps
  const getTimelineSteps = (d: Delivery) => {
    const { routeName, driverName, vehiclePlate } = getDeliveryRouteDetails(d);

    const baseDate = new Date(d.createdAt);
    const formatOffsetDate = (minutesOffset: number) => {
      const date = new Date(baseDate.getTime() + minutesOffset * 60000);
      return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    };

    const steps: {
      title: string;
      description: string;
      timestamp: string;
      icon: React.ReactNode;
      isCompleted: boolean;
      isActive: boolean;
      colorClass: string;
    }[] = [];

    // Step 5: Delivered
    if (d.status === DeliveryStatus.Entregada) {
      steps.push({
        title: "¡Pedido Entregado con Éxito!",
        description: `El transportador completó la entrega en el domicilio. Recibido por ${d.receivedByName || "María Camila Ortega"} (${d.receivedByDocument || "CC 1.094.882.112"}). Firma digital y foto de evidencia registradas.`,
        timestamp: d.deliveredAt ? new Date(d.deliveredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(d.deliveredAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : formatOffsetDate(120),
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        isCompleted: true,
        isActive: true,
        colorClass: "bg-emerald-50 border-emerald-200 text-emerald-600"
      });
    }

    // Step 4.5: Failed
    if (d.status === DeliveryStatus.Fallida) {
      steps.push({
        title: "Intento de Entrega Fallido / Novedad Registrada",
        description: `No se pudo entregar el pedido. Motivo reportado: "${d.failureReason || "Cliente ausente"}" por el conductor ${driverName}. Se programará un nuevo reintento de reparto.`,
        timestamp: new Date(d.updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(d.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" }),
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        isCompleted: true,
        isActive: true,
        colorClass: "bg-red-50 border-red-200 text-red-600"
      });
    }

    // Step 4: En Sitio
    const isEnSitioCompleted = [DeliveryStatus.EnSitio, DeliveryStatus.Entregada].includes(d.status);
    const isEnSitioActive = d.status === DeliveryStatus.EnSitio;
    if (isEnSitioCompleted || isEnSitioActive) {
      steps.push({
        title: "Conductor en el Sitio de Entrega",
        description: `El vehículo con placa ${vehiclePlate} llegó al domicilio del cliente en ${d.city} (${d.address}). El conductor está localizando al contacto de entrega.`,
        timestamp: isEnSitioActive ? new Date(d.updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(d.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : formatOffsetDate(90),
        icon: <MapPin className="w-4 h-4 text-purple-600" />,
        isCompleted: isEnSitioCompleted,
        isActive: isEnSitioActive,
        colorClass: isEnSitioActive ? "bg-purple-100 border-purple-300 text-purple-600 ring-2 ring-purple-200" : "bg-purple-50 border-purple-100 text-purple-500"
      });
    }

    // Step 3: Despachado / En Reparto
    const isEnCaminoCompleted = [DeliveryStatus.EnCamino, DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida].includes(d.status);
    const isEnCaminoActive = d.status === DeliveryStatus.EnCamino;
    if (isEnCaminoCompleted || isEnCaminoActive) {
      steps.push({
        title: "Despachado del Almacén / En Tránsito",
        description: `El pedido salió del Centro de Distribución. El transportador ${driverName} se encuentra en camino conduciendo el vehículo con placa ${vehiclePlate}.`,
        timestamp: isEnCaminoActive ? new Date(d.updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(d.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : formatOffsetDate(50),
        icon: <Truck className="w-4 h-4 text-purple-600" />,
        isCompleted: isEnCaminoCompleted,
        isActive: isEnCaminoActive,
        colorClass: isEnCaminoActive ? "bg-purple-100 border-purple-300 text-purple-600 ring-2 ring-purple-200" : "bg-purple-50 border-purple-100 text-purple-500"
      });
    }

    // Step 2: Assigned
    const isAsignadaCompleted = [DeliveryStatus.Asignada, DeliveryStatus.EnCamino, DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida].includes(d.status);
    const isAsignadaActive = d.status === DeliveryStatus.Asignada;
    if (isAsignadaCompleted || isAsignadaActive) {
      steps.push({
        title: "Ruta Planificada y Carga Completa",
        description: `Pedido planificado y asignado a la ruta "${routeName}" operada por ${driverName}. Carga de mercancías validada y lista para despacho.`,
        timestamp: isAsignadaActive ? new Date(d.updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(d.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : formatOffsetDate(20),
        icon: <ClipboardCheck className="w-4 h-4 text-purple-600" />,
        isCompleted: isAsignadaCompleted,
        isActive: isAsignadaActive,
        colorClass: isAsignadaActive ? "bg-purple-100 border-purple-300 text-purple-600 ring-2 ring-purple-200" : "bg-purple-50 border-purple-100 text-purple-500"
      });
    }

    // Step 1: Registered
    steps.push({
      title: "Pedido Recibido en Centro de Distribución",
      description: `La orden con código de rastreo ${d.code} fue registrada y confirmada en el sistema RutaTrack de la sede ${d.city}.`,
      timestamp: formatOffsetDate(0),
      icon: <Package className="w-4 h-4 text-purple-600" />,
      isCompleted: true,
      isActive: d.status === DeliveryStatus.Pendiente,
      colorClass: d.status === DeliveryStatus.Pendiente ? "bg-purple-100 border-purple-300 text-purple-600 ring-2 ring-purple-200" : "bg-purple-50 border-purple-100 text-purple-500"
    });

    return steps;
  };

  const { routeName, driverName, driverPhone, vehiclePlate, vehicleType } = selectedDelivery
    ? getDeliveryRouteDetails(selectedDelivery)
    : { routeName: "", driverName: "", driverPhone: "", vehiclePlate: "", vehicleType: "" };

  const selectedClient = selectedDelivery
    ? clients.find(c => c.id === selectedDelivery.clientId)
    : null;

  // Render Stats summary
  const totalDelsCount = deliveries.length;
  const pendingCount = deliveries.filter(d => d.status === DeliveryStatus.Pendiente).length;
  const onRoadCount = deliveries.filter(d => d.status === DeliveryStatus.EnCamino || d.status === DeliveryStatus.EnSitio).length;
  const deliveredCount = deliveries.filter(d => d.status === DeliveryStatus.Entregada).length;
  const failedCount = deliveries.filter(d => d.status === DeliveryStatus.Fallida).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="delivery-tracking-root">
      
      {/* LEFT COLUMN: Search & Orders selection list */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-4">
        
        <div>
          <h3 className="font-sans font-bold text-stone-900 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Rastreo de Envíos
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Seguimiento detallado en tiempo real.</p>
        </div>

        {/* Quick Mini Stats inside sidebar */}
        <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
          <div className="text-center">
            <span className="text-[10px] font-semibold text-stone-400 block uppercase">En Camino</span>
            <span className="text-lg font-bold text-purple-500">{onRoadCount}</span>
          </div>
          <div className="text-center border-l border-stone-200">
            <span className="text-[10px] font-semibold text-stone-400 block uppercase">Entregados</span>
            <span className="text-lg font-bold text-emerald-600">{deliveredCount}</span>
          </div>
        </div>

        {/* Search Input */}
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Buscar Orden</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Código (ENT-001) o dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-stone-200 rounded-xl pl-8 pr-2 py-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white transition-all font-medium"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
          </div>
        </div>

        {/* Status Filter Dropdown */}
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">Filtrar por Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all font-medium"
          >
            <option value="TODOS">Todos los estados</option>
            <option value={DeliveryStatus.Pendiente}>Pendiente</option>
            <option value={DeliveryStatus.Asignada}>Asignado / Cargado</option>
            <option value={DeliveryStatus.EnCamino}>En Tránsito</option>
            <option value={DeliveryStatus.EnSitio}>En Sitio</option>
            <option value={DeliveryStatus.Entregada}>Entregada</option>
            <option value={DeliveryStatus.Fallida}>Intento Fallido</option>
          </select>
        </div>

        {/* Delivery Cards List */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Lista de Envíos ({filteredDeliveries.length})
            </span>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[10px] text-purple-500 font-bold hover:underline">
                Limpiar
              </button>
            )}
          </div>

          {filteredDeliveries.length === 0 ? (
            <div className="text-center text-xs text-stone-400 py-6 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              No se encontraron pedidos.
            </div>
          ) : (
            filteredDeliveries.map((d) => {
              const isSelected = selectedDelivery?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDelivery(d);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-200"
                      : "bg-stone-50/50 border-stone-200 hover:bg-stone-100/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-800">{d.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                      d.status === DeliveryStatus.Entregada
                        ? "bg-emerald-100 text-emerald-800"
                        : d.status === DeliveryStatus.Fallida
                        ? "bg-red-100 text-red-800"
                        : d.status === DeliveryStatus.EnCamino || d.status === DeliveryStatus.EnSitio
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {d.status === DeliveryStatus.Asignada ? "ASIGNADO" : d.status === DeliveryStatus.EnCamino ? "EN TRÁNSITO" : d.status}
                    </span>
                  </div>
                  <p className="text-stone-600 truncate font-semibold">{d.address}</p>
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>{d.city}</span>
                    <span className={`font-bold ${
                      d.priority === "Alta" ? "text-red-500" : d.priority === "Media" ? "text-amber-500" : "text-blue-500"
                    }`}>
                      {d.priority}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Tracking Board */}
      <div className="lg:col-span-3 flex flex-col gap-6" id="delivery-tracking-center">
        
        {selectedDelivery ? (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-6">
            
            {/* 1. HEADER HERO STATUS CARD (ORANGE THEME) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`p-4 rounded-2xl shadow-sm text-white ${
                  selectedDelivery.status === DeliveryStatus.Entregada
                    ? "bg-emerald-500 shadow-emerald-500/20"
                    : selectedDelivery.status === DeliveryStatus.Fallida
                    ? "bg-red-500 shadow-red-500/20"
                    : "bg-purple-600 shadow-purple-500/20"
                }`}>
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest font-mono">SEGUIMIENTO EN LÍNEA</span>
                    <span className="font-mono text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full border border-stone-200 flex items-center gap-1 font-semibold">
                      <QrCode className="w-3.5 h-3.5 text-stone-400" /> {selectedDelivery.code}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-sans font-extrabold text-stone-900 mt-1 flex items-center gap-2">
                    {selectedDelivery.status === DeliveryStatus.Entregada ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        ¡Entregado con Éxito!
                      </span>
                    ) : selectedDelivery.status === DeliveryStatus.Fallida ? (
                      <span className="text-red-600 flex items-center gap-1.5">
                        Entrega Fallida / Novedad
                      </span>
                    ) : (
                      <span className="text-purple-600 flex items-center gap-1.5">
                        Envío en Curso a {selectedDelivery.city}
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              {/* Delivery ETA Window */}
              <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl flex items-center gap-3 md:self-stretch">
                <Calendar className="w-6 h-6 text-purple-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-purple-600 uppercase tracking-wider font-bold block">Entrega Estimada</span>
                  <p className="text-sm font-extrabold text-stone-800">
                    {selectedDelivery.status === DeliveryStatus.Entregada
                      ? `Completado: ${new Date(selectedDelivery.deliveredAt || selectedDelivery.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`
                      : `${new Date(selectedDelivery.scheduledDate).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`}
                  </p>
                  <p className="text-xs text-stone-500 font-semibold">Horario: {selectedDelivery.timeWindowStart} - {selectedDelivery.timeWindowEnd}</p>
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC HORIZONTAL PROGRESS BAR */}
            <div className="relative py-6 px-4 bg-stone-50/50 rounded-2xl border border-stone-150">
              <div className="absolute top-[42px] left-[40px] right-[40px] h-1.5 bg-stone-200 -translate-y-1/2 rounded-full z-0" />
              
              {/* Colored Active line */}
              <div
                className="absolute top-[42px] left-[40px] h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                style={{
                  width:
                    selectedDelivery.status === DeliveryStatus.Pendiente ? "0%" :
                    selectedDelivery.status === DeliveryStatus.Asignada ? "25%" :
                    selectedDelivery.status === DeliveryStatus.EnCamino ? "50%" :
                    selectedDelivery.status === DeliveryStatus.EnSitio ? "75%" :
                    selectedDelivery.status === DeliveryStatus.Entregada || selectedDelivery.status === DeliveryStatus.Fallida ? "100%" : "0%"
                }}
              />
              
              <div className="relative z-10 flex justify-between">
                {[
                  { label: "Registrado", icon: Package, activeState: [DeliveryStatus.Pendiente, DeliveryStatus.Asignada, DeliveryStatus.EnCamino, DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida] },
                  { label: "Asignado", icon: ClipboardCheck, activeState: [DeliveryStatus.Asignada, DeliveryStatus.EnCamino, DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida] },
                  { label: "En Tránsito", icon: Truck, activeState: [DeliveryStatus.EnCamino, DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida] },
                  { label: "En Sitio", icon: MapPin, activeState: [DeliveryStatus.EnSitio, DeliveryStatus.Entregada, DeliveryStatus.Fallida] },
                  { label: selectedDelivery.status === DeliveryStatus.Fallida ? "Fallido" : "Entregado", icon: selectedDelivery.status === DeliveryStatus.Fallida ? XCircle : CheckCircle2, activeState: [DeliveryStatus.Entregada, DeliveryStatus.Fallida], isEnd: true }
                ].map((step, idx) => {
                  const isCompleted = step.activeState.includes(selectedDelivery.status);
                  const isCurrent = (selectedDelivery.status === DeliveryStatus.Pendiente && idx === 0) ||
                    (selectedDelivery.status === DeliveryStatus.Asignada && idx === 1) ||
                    (selectedDelivery.status === DeliveryStatus.EnCamino && idx === 2) ||
                    (selectedDelivery.status === DeliveryStatus.EnSitio && idx === 3) ||
                    ((selectedDelivery.status === DeliveryStatus.Entregada || selectedDelivery.status === DeliveryStatus.Fallida) && idx === 4);

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? step.isEnd && selectedDelivery.status === DeliveryStatus.Fallida
                              ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200"
                              : "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-100"
                            : "bg-white border-stone-200 text-stone-400"
                        } ${isCurrent ? "scale-110 ring-4 ring-purple-100" : ""}`}
                      >
                        <step.icon className={`w-5 h-5 ${isCurrent ? "animate-pulse" : ""}`} />
                      </div>
                      <span className={`text-[10px] font-bold mt-2 text-center leading-tight ${isCurrent ? "text-purple-600" : isCompleted ? "text-stone-800" : "text-stone-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SIMULATOR CONSOLE ACTIONS */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-purple-500 animate-spin-slow" /> Consola de Simulación Manual
                </h4>
                <p className="text-xs text-purple-700/90 leading-normal mt-0.5 font-medium">
                  Prueba paso a paso el cambio de estados en la línea de tiempo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedDelivery.status !== DeliveryStatus.Entregada && selectedDelivery.status !== DeliveryStatus.Fallida && (
                  <>
                    <button
                      onClick={() => handleSimulateNextStep(selectedDelivery)}
                      className="text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all py-2 px-4 rounded-xl shadow-md shadow-purple-500/10 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Avanzar Estado
                    </button>
                    <button
                      onClick={() => handleSimulateFailure(selectedDelivery)}
                      className="text-xs font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all py-2 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" /> Marcar Fallido
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleResetDelivery(selectedDelivery)}
                  className="text-xs font-bold bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-4 h-4" /> Reiniciar Envío
                </button>
              </div>
            </div>

            {/* 4. CONTENT GRID: CHRONOLOGICAL EVENTS (LEFT) & DETAILS CARD (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Detailed Event timeline list */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Historial Detallado de Ruta
                </h3>

                <div className="relative pl-8 border-l border-stone-200 ml-4 flex flex-col gap-6 py-2">
                  {getTimelineSteps(selectedDelivery).map((step, idx) => (
                    <div key={idx} className="relative group">
                      
                      {/* Circle icon on timeline node */}
                      <div
                        className={`absolute -left-[48px] top-0.5 w-8 h-8 rounded-full border bg-white flex items-center justify-center transition-all ${step.colorClass}`}
                      >
                        {step.icon}
                      </div>

                      {/* Event description card */}
                      <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-100 hover:border-stone-200 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className={`text-sm font-bold ${step.isActive ? "text-purple-600" : "text-stone-800"}`}>
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100 py-0.5 px-2 rounded-full self-start sm:self-center">
                            {step.timestamp}
                          </span>
                        </div>
                        <p className="text-xs mt-1.5 leading-relaxed text-stone-600 font-medium">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details / Courier card */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                
                {/* Package Courier Details */}
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                    <Truck className="w-4 h-4 text-purple-500" /> Transportador Asignado
                  </h4>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-stone-800 text-sm block">{driverName}</strong>
                      <span className="text-[10px] text-stone-500 font-semibold">{vehicleType} | Placa: <strong className="font-mono">{vehiclePlate}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Contacto: <strong>{driverPhone}</strong></span>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                    <MapPin className="w-4 h-4 text-purple-500" /> Destino de Entrega
                  </h4>

                  <div className="flex flex-col gap-2 text-xs text-stone-600">
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Destinatario</span>
                      <strong className="text-stone-800 text-sm">{selectedClient?.name || "Cliente Corporativo"}</strong>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Dirección de Envío</span>
                      <strong className="text-stone-800">{selectedDelivery.address}</strong>
                      <span className="text-stone-500 block text-[10px] font-medium">{selectedDelivery.city} (Colombia)</span>
                    </div>

                    {selectedDelivery.notes && (
                      <div className="border-t border-stone-200 pt-2.5 mt-1">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Indicaciones Especiales</span>
                        <p className="italic text-stone-700 mt-1 leading-normal font-medium">{selectedDelivery.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Security Alert */}
                <div className="bg-stone-100 border border-stone-200 p-4 rounded-2xl flex gap-2.5 items-start">
                  <ShieldAlert className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-stone-600 leading-normal font-medium">
                    Su privacidad es nuestra prioridad. La información del transportador y las firmas digitales de recibo están protegidas por encriptación avanzada de RutaTrack.
                  </p>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 shadow-sm text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <div className="p-4 bg-purple-50 text-purple-500 rounded-full">
              <Package className="w-12 h-12" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-stone-900 text-lg">No hay ningún pedido seleccionado</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Selecciona un pedido de la lista de envíos de la izquierda para ver su línea de tiempo interactiva.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
