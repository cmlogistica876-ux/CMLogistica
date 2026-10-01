/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Delivery, Client, Driver, Route, Incident } from "../types";
import { FileText, ArrowLeft, MapPin, Calendar, Clock, UserCheck, Image, ShieldAlert } from "lucide-react";

interface DeliveryDetailProps {
  deliveryId: string;
  onBack: () => void;
}

export default function DeliveryDetail({ deliveryId, onBack }: DeliveryDetailProps) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const loadData = () => {
      const d = DbService.getDeliveries().find((item) => item.id === deliveryId);
      if (d) {
        setDelivery(d);

        // Resolve mappings
        const c = DbService.getClients().find((cli) => cli.id === d.clientId);
        setClient(c || null);

        if (d.routeId) {
          const r = DbService.getRoutes().find((ro) => ro.id === d.routeId);
          setRoute(r || null);
          if (r?.driverId) {
            const drv = DbService.getDrivers().find((dri) => dri.id === r.driverId);
            setDriver(drv || null);
          }
        }

        // Fetch matching incidents
        const deliveryIncidents = DbService.getIncidents().filter((inc) => inc.deliveryId === d.id);
        deliveryIncidents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setIncidents(deliveryIncidents);
      }
    };

    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, [deliveryId]);

  if (!delivery) {
    return (
      <div className="bg-white p-8 rounded-xl border border-stone-200 text-center flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h4 className="font-bold text-stone-800 text-base">Error: Despacho No Encontrado</h4>
        <p className="text-xs text-stone-500">La orden con ID {deliveryId} no está registrada en la base de datos.</p>
        <button
          onClick={onBack}
          className="bg-purple-900 hover:bg-purple-800 text-stone-100 text-xs font-semibold py-2 px-4 rounded-lg"
        >
          Regresar al listado
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="delivery-detail-container">
      {/* Return Navigation bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 p-2 rounded-lg transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
            Expediente de Despacho: <span className="font-mono font-bold">{delivery.code}</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Consulta de datos operacionales, histórico y evidencias registradas.</p>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core parameters */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section 1: Overview */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <h4 className="font-sans font-bold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-150 pb-2">
              <FileText className="w-4 h-4 text-stone-500" /> Información General de la Orden
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Cliente Solicitante</span>
                <span className="font-semibold text-stone-800 block mt-0.5">{client?.name || "No definido"}</span>
                <span className="text-[10px] text-stone-400 font-mono">NIT: {client?.taxId || "..."}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Estado Actual</span>
                <span className="font-bold text-stone-800 block mt-0.5">{delivery.status}</span>
                <span className="text-[10px] text-stone-400 font-mono">Prioridad: {delivery.priority}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Fecha y Hora Programada</span>
                <span className="font-semibold text-stone-800 block mt-0.5">{delivery.scheduledDate}</span>
                <span className="text-[10px] text-stone-400 font-mono">Ventana: {delivery.timeWindowStart} - {delivery.timeWindowEnd}</span>
              </div>
            </div>

            <hr className="border-stone-150" />

            {/* Address */}
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin className="w-4 h-4 text-stone-500 mt-1" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Dirección de Entrega</span>
                <span className="font-semibold text-stone-800 block mt-0.5">{delivery.address}</span>
                <span className="text-xs text-stone-500 font-mono block">Ciudad: {delivery.city} • Coordenadas: [{delivery.location.lat}, {delivery.location.lng}]</span>
              </div>
            </div>

            {delivery.notes && (
              <>
                <hr className="border-stone-150" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Indicaciones / Observaciones Especiales</span>
                  <p className="text-xs text-stone-600 bg-stone-50 border border-stone-200 p-2.5 rounded-lg mt-1 font-medium italic">
                    "{delivery.notes}"
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Section 2: Assignation */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <h4 className="font-sans font-bold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-150 pb-2">
              <Calendar className="w-4 h-4 text-stone-500" /> Planificación de Tránsito
            </h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Ruta Asociada</span>
                {route ? (
                  <div className="mt-1">
                    <span className="font-bold text-stone-800">{route.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono block">Código: {route.code} • {route.status}</span>
                  </div>
                ) : (
                  <span className="text-xs text-stone-400 italic block mt-1">No asignada a ninguna ruta aún</span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Conductor Transportador</span>
                {driver ? (
                  <div className="mt-1">
                    <span className="font-bold text-stone-800">{driver.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono block">Licencia: {driver.licenseNumber} • Cédula: {driver.document}</span>
                  </div>
                ) : (
                  <span className="text-xs text-stone-400 italic block mt-1">Conductor no asignado</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Evidences proof column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <h4 className="font-sans font-bold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-150 pb-2">
              <UserCheck className="w-4 h-4 text-stone-500" /> Evidencias de Entrega (POD)
            </h4>

            {delivery.deliveredAt ? (
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Hora del Registro</span>
                  <span className="font-semibold text-stone-800 block mt-0.5">{delivery.deliveredAt}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Recibido Por</span>
                  <span className="font-bold text-stone-800 block mt-0.5">{delivery.receivedByName || "No reportado"}</span>
                  <span className="text-[10px] text-stone-400 font-mono">Documento: {delivery.receivedByDocument || "S/D"}</span>
                </div>

                {delivery.deliveredLocation && (
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">GPS Capturado en Sitio</span>
                    <span className="font-semibold text-stone-800 font-mono block mt-0.5">
                      Lat: {delivery.deliveredLocation.lat.toFixed(6)}, Lng: {delivery.deliveredLocation.lng.toFixed(6)}
                    </span>
                  </div>
                )}

                {/* Evidence Photo */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">Registro Fotográfico</span>
                  {delivery.evidencePhoto ? (
                    <div className="rounded-lg border border-stone-200 overflow-hidden bg-stone-50 flex items-center justify-center p-1">
                      <img
                        src={delivery.evidencePhoto}
                        alt="Evidencia fotográfica"
                        className="w-full max-h-[160px] object-cover rounded-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed border-stone-200 p-4 rounded-lg text-center text-xs text-stone-400 italic">
                      Sin registro de fotografía cargado.
                    </div>
                  )}
                </div>

                {/* Signature photo */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">Firma Digital Digitalizada</span>
                  {delivery.signatureBase64 ? (
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 flex items-center justify-center">
                      <img
                        src={delivery.signatureBase64}
                        alt="Firma del destinatario"
                        className="max-h-[100px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed border-stone-200 p-4 rounded-lg text-center text-xs text-stone-400 italic">
                      Sin firma digitalizada del receptor.
                    </div>
                  )}
                </div>
              </div>
            ) : delivery.status === "Fallida" ? (
              <div className="flex flex-col gap-4 text-sm">
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-bold block">Entrega Reportada como Fallida</strong>
                    <span className="text-xs block mt-0.5 font-medium">Motivo de Novedad:</span>
                    <span className="text-xs font-bold font-mono block mt-0.5">"{delivery.failureReason || "No reportado"}"</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Hora del Reporte</span>
                  <span className="font-semibold text-stone-800 block mt-0.5">{delivery.deliveredAt || "N/A"}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-stone-400 italic">
                La entrega se encuentra en estado "{delivery.status}". Las evidencias se visualizarán una vez el transportador complete la orden en sitio.
              </div>
            )}
          </div>

          {/* Section 3: Historial de Novedades */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <h4 className="font-sans font-bold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-150 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Historial de Novedades Reportadas
            </h4>

            {incidents.length > 0 ? (
              <div className="flex flex-col gap-3">
                {incidents.map((inc) => {
                  const rawDate = new Date(inc.createdAt);
                  const formattedDateTime = isNaN(rawDate.getTime())
                    ? inc.createdAt.replace("T", " ").substring(0, 16)
                    : rawDate.toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      }) + " • " + rawDate.toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      });

                  return (
                    <div
                      key={inc.id}
                      className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/50 flex flex-col gap-1.5 text-xs text-stone-700"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px] uppercase">
                          {inc.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          inc.status === "Abierto" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <p className="font-medium text-stone-800 italic">"{inc.description}"</p>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono mt-1 border-t border-amber-200/20 pt-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Reportado: {formattedDateTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-stone-400 italic">
                No se han registrado novedades ni alertas asociadas a esta orden.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
