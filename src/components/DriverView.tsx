/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DbService } from "../services/db";
import { Route, RouteStatus, Delivery, DeliveryStatus, Driver, Vehicle, IncidentType, EvidenceType } from "../types";
import { MapPin, CheckCircle2, AlertOctagon, Signature, Image, Play, LogOut, Check, ArrowRight, RefreshCw, Radio } from "lucide-react";

interface DriverViewProps {
  onLogout: () => void;
}

export default function DriverView({ onLogout }: DriverViewProps) {
  const [currentUser, setCurrentUser] = useState(DbService.getCurrentUser());
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Sharing GPS state
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastGpsCoords, setLastGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Evidence Modal / Inputs
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [evidenceTypeSelection, setEvidenceTypeSelection] = useState<"ENTREGADO" | "FALLIDO">("ENTREGADO");
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverDoc, setReceiverDoc] = useState<string>("");
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [failureReason, setFailureReason] = useState<string>("");

  // Novedad Drawer / Inputs
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<IncidentType>(IncidentType.Trafico);
  const [incidentDesc, setIncidentDesc] = useState<string>("");

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Sync state
  const loadDriverState = () => {
    const user = DbService.getCurrentUser();
    setCurrentUser(user);
    if (!user || !user.driverId) return;

    const allDrivers = DbService.getDrivers();
    const foundDriver = allDrivers.find((d) => d.id === user.driverId);
    setDriver(foundDriver || null);

    if (foundDriver) {
      // Find assigned vehicle
      const allVehicles = DbService.getVehicles();
      const foundVeh = allVehicles.find((v) => v.id === foundDriver.assignedVehicleId);
      setVehicle(foundVeh || null);

      // Find active/planned route for this driver today
      const allRoutes = DbService.getRoutes();
      const activeRoute = allRoutes.find(
        (r) => r.driverId === foundDriver.id && r.status !== RouteStatus.Finalizada && r.status !== RouteStatus.Cancelada
      );
      setRoute(activeRoute || null);

      if (activeRoute) {
        const allDels = DbService.getDeliveries();
        const routeDels = activeRoute.deliveryIds
          .map((id) => allDels.find((d) => d.id === id))
          .filter((d): d is Delivery => !!d);
        setDeliveries(routeDels);
      } else {
        setDeliveries([]);
      }
    }
  };

  useEffect(() => {
    loadDriverState();
    const unsubscribe = DbService.subscribeToDb(loadDriverState);
    return () => unsubscribe();
  }, []);

  // Browser Geolocation capture loop
  useEffect(() => {
    if (!isSharingLocation || !navigator.geolocation || !driver || !vehicle || !route) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const speed = position.coords.speed ? position.coords.speed * 3.6 : 0; // m/s to km/h

          setLastGpsCoords({ lat, lng });
          setGpsError(null);

          // Update vehicle GPS in global database
          DbService.updateVehicleLocation(vehicle.id, driver.id, route.id, { lat, lng }, {
            accuracy,
            speed
          });
        },
        (error) => {
          console.warn("GPS Location error:", error);
          setGpsError("No se pudo capturar GPS. Compartiendo coordenadas simuladas.");
          
          // Simulation fallback coordinates for Colombia
          const defaultLat = 4.7110;
          const defaultLng = -74.0721;
          const deltaLat = (Math.random() - 0.5) * 0.001;
          const deltaLng = (Math.random() - 0.5) * 0.001;
          const simulatedLat = lastGpsCoords?.lat ? lastGpsCoords.lat + deltaLat : defaultLat;
          const simulatedLng = lastGpsCoords?.lng ? lastGpsCoords.lng + deltaLng : defaultLng;

          setLastGpsCoords({ lat: simulatedLat, lng: simulatedLng });

          DbService.updateVehicleLocation(vehicle.id, driver.id, route.id, {
            lat: simulatedLat,
            lng: simulatedLng
          }, {
            accuracy: 10,
            speed: 25
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 10000); // Send updates every 10 seconds

    return () => clearInterval(interval);
  }, [isSharingLocation, driver, vehicle, route, lastGpsCoords]);

  // Handle Canvas Drawing for Signature Pad
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getMousePos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e293b"; // dark charcoal brush
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert File Input to Base64 Image
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // State Updates from Driver Cockpit
  const handleStartRoute = () => {
    if (!route) return;
    try {
      DbService.updateRoute(route.id, { status: RouteStatus.EnCurso });
      setIsSharingLocation(true); // Automatically share location on route start
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArrivedAtPoint = (delId: string) => {
    try {
      DbService.updateDelivery(delId, { status: DeliveryStatus.EnSitio });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEvidenceModal = (delivery: Delivery, outcome: "ENTREGADO" | "FALLIDO") => {
    setSelectedDelivery(delivery);
    setEvidenceTypeSelection(outcome);
    setShowEvidenceModal(true);
    setReceiverName("");
    setReceiverDoc("");
    setPhotoBase64("");
    setFailureReason("");
  };

  const handleSaveEvidenceOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !route) return;

    try {
      if (evidenceTypeSelection === "ENTREGADO") {
        if (!receiverName || !receiverDoc) {
          alert("Por favor ingresa el nombre y documento de quien recibe.");
          return;
        }

        // Get signature as Base64 from Canvas
        const canvas = canvasRef.current;
        let signatureUrl = "";
        if (canvas) {
          signatureUrl = canvas.toDataURL();
        }

        // Upload signature evidence
        if (signatureUrl) {
          await DbService.uploadEvidence(selectedDelivery.id, EvidenceType.Firma, signatureUrl);
        }

        // Upload photo evidence if attached
        if (photoBase64) {
          await DbService.uploadEvidence(selectedDelivery.id, EvidenceType.Foto, photoBase64);
        }

        // Complete delivery state transition
        DbService.updateDelivery(selectedDelivery.id, {
          status: DeliveryStatus.Entregada,
          receivedByName: receiverName,
          receivedByDocument: receiverDoc,
          deliveredAt: new Date().toISOString()
        });

      } else {
        // Delivery failed (Novedad)
        if (!failureReason) {
          alert("Por favor selecciona un motivo de falla.");
          return;
        }

        // Record a new incident (novedad)
        DbService.createIncident({
          routeId: route.id,
          deliveryId: selectedDelivery.id,
          driverId: driver!.id,
          vehicleId: vehicle!.id,
          type: failureReason as IncidentType,
          description: `Entrega fallida reportada por conductor. Motivo: ${failureReason}.`
        });
      }

      setShowEvidenceModal(false);
      setSelectedDelivery(null);

      // Check if all deliveries are finished to ask to complete route
      const freshDels = DbService.getDeliveries().filter((d) => d.routeId === route.id);
      const remaining = freshDels.filter((d) => d.status !== DeliveryStatus.Entregada && d.status !== DeliveryStatus.Fallida && d.status !== DeliveryStatus.Cancelada);
      if (remaining.length === 0) {
        if (confirm("¡Todas las entregas han sido procesadas! ¿Deseas finalizar la ruta operativa?")) {
          DbService.updateRoute(route.id, { status: RouteStatus.Finalizada });
          setIsSharingLocation(false);
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegisterIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!route || !driver || !vehicle) return;

    try {
      DbService.createIncident({
        routeId: route.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        type: incidentType,
        description: incidentDesc
      });

      setShowIncidentModal(false);
      setIncidentDesc("");
      alert("Novedad reportada exitosamente a la central operativa.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen pb-16 flex flex-col justify-between" id="driver-app-frame">
      {/* Mobile Top Bar */}
      <div className="bg-purple-950 text-stone-100 p-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="font-bold font-sans text-sm tracking-wide">RutaTrack Conductor</h2>
            <p className="text-[10px] text-purple-300">Panel Móvil de Última Milla</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="text-xs bg-purple-900 hover:bg-purple-800 text-stone-100 py-1.5 px-3 rounded-lg border border-purple-800 flex items-center gap-1.5 min-h-[44px]"
        >
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      {/* Driver metadata banner */}
      <div className="bg-white p-4 border-b border-stone-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Operador</span>
          <h3 className="font-semibold text-stone-800 text-sm">{driver ? driver.name : "Cargando..."}</h3>
          <p className="text-xs text-stone-500">Placa: <span className="font-mono font-bold">{vehicle ? vehicle.plate : "S/V"}</span> • C2</p>
        </div>

        {/* Location Signal Indicator */}
        <button
          onClick={() => setIsSharingLocation(!isSharingLocation)}
          disabled={!route || route.status !== RouteStatus.EnCurso}
          className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-full border transition ${
            isSharingLocation
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-stone-100 text-stone-500 border-stone-200"
          } min-h-[44px]`}
        >
          <Radio className={`w-3.5 h-3.5 ${isSharingLocation ? "animate-ping" : ""}`} />
          <span>{isSharingLocation ? "GPS Activo" : "Compartir GPS"}</span>
        </button>
      </div>

      {gpsError && (
        <div className="bg-rose-50 text-rose-800 px-4 py-2 border-b border-rose-200 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Primary Cockpit Content */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        {route ? (
          <>
            {/* Route Header card */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{route.code}</span>
              <h4 className="font-bold text-stone-800 text-base mt-1">{route.name}</h4>
              <p className="text-xs text-stone-500 mt-1">
                Estado:{" "}
                <span className="font-semibold text-stone-700">{route.status}</span>
              </p>

              {route.status === RouteStatus.Asignada && (
                <button
                  onClick={handleStartRoute}
                  className="w-full bg-purple-900 hover:bg-purple-800 text-stone-100 font-bold text-sm py-3 px-4 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
                >
                  <Play className="w-4 h-4" /> INICIAR RUTA DE HOY
                </button>
              )}
            </div>

            {/* Checkpoints list */}
            {route.status === RouteStatus.EnCurso && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-stone-800 text-sm">Entregas Asignadas ({deliveries.length})</h5>
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    className="text-xs text-rose-600 font-bold flex items-center gap-1 min-h-[44px]"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Reportar Novedad de Ruta
                  </button>
                </div>

                {deliveries.length > 0 ? (
                  deliveries.map((del, idx) => {
                    const isFinished = del.status === DeliveryStatus.Entregada || del.status === DeliveryStatus.Fallida || del.status === DeliveryStatus.Cancelada;

                    return (
                      <div
                        key={del.id}
                        className={`bg-white p-4 rounded-xl border shadow-sm transition flex flex-col gap-3 ${
                          isFinished ? "border-stone-200 opacity-60" : "border-stone-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                              Parada #{idx + 1} • {del.code}
                            </span>
                            <h6 className="font-bold text-stone-800 text-sm mt-2">{del.address}</h6>
                            <p className="text-xs text-stone-500">{del.city}</p>
                            <p className="text-[11px] text-stone-400 mt-1">Ventana: {del.timeWindowStart} - {del.timeWindowEnd}</p>
                          </div>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${
                              del.status === DeliveryStatus.Entregada
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : del.status === DeliveryStatus.Fallida
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : del.status === DeliveryStatus.EnSitio
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-purple-50 text-purple-700 border border-purple-100"
                            }`}
                          >
                            {del.status}
                          </span>
                        </div>

                        {/* Action buttons if not finished */}
                        {!isFinished && (
                          <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
                            {del.status === DeliveryStatus.EnCamino || del.status === DeliveryStatus.Asignada ? (
                              <button
                                onClick={() => handleArrivedAtPoint(del.id)}
                                className="flex-1 bg-purple-900 hover:bg-purple-800 text-stone-100 font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 min-h-[44px]"
                              >
                                <MapPin className="w-3.5 h-3.5" /> Llegué al punto
                              </button>
                            ) : del.status === DeliveryStatus.EnSitio ? (
                              <>
                                <button
                                  onClick={() => handleOpenEvidenceModal(del, "ENTREGADO")}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 min-h-[44px]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Entregado
                                </button>
                                <button
                                  onClick={() => handleOpenEvidenceModal(del, "FALLIDO")}
                                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 min-h-[44px]"
                                >
                                  <AlertOctagon className="w-3.5 h-3.5" /> Falla
                                </button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 bg-white border border-stone-200 rounded-xl">
                    <p className="text-xs text-stone-400">Esta ruta no tiene puntos de entrega configurados.</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-stone-200 mt-4 shadow-sm flex flex-col items-center justify-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-stone-400" />
            <div>
              <h4 className="font-bold text-stone-800 text-base">¡Sin Rutas Hoy!</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                No tienes ninguna ruta planificada o asignada para hoy. Puedes relajarte o consultar al despachador operativo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER PWA WATERMARK */}
      <div className="text-center text-[10px] text-stone-400 py-3 border-t border-stone-200 bg-white">
        RutaTrack Logistics Engine v1.0 • Bogotá, CO
      </div>

      {/* EVIDENCE COLLECTION DRAWER / MODAL */}
      {showEvidenceModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-end justify-center backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-150 pb-3 mb-4">
              <h4 className="font-bold text-stone-900 text-base">
                {evidenceTypeSelection === "ENTREGADO" ? "Completar Entrega" : "Reportar Entrega Fallida"}
              </h4>
              <span className="font-mono text-xs font-bold text-stone-500">{selectedDelivery.code}</span>
            </div>

            <form onSubmit={handleSaveEvidenceOutcome} className="flex flex-col gap-4">
              {evidenceTypeSelection === "ENTREGADO" ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre de quien recibe</label>
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Ej. Martha Restrepo"
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Cédula / Documento</label>
                    <input
                      type="text"
                      required
                      value={receiverDoc}
                      onChange={(e) => setReceiverDoc(e.target.value)}
                      placeholder="Ej. 1019123456"
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400 min-h-[44px]"
                    />
                  </div>

                  {/* Photo attachments simulation */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Evidencia Fotográfica</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        id="photo-file"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="photo-file"
                        className="flex-1 border-2 border-dashed border-stone-200 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 min-h-[44px]"
                      >
                        <Image className="w-6 h-6 text-stone-400" />
                        <span className="text-[11px] font-bold text-stone-600">
                          {photoBase64 ? "Foto cargada ✓" : "Tomar foto / Cargar archivo"}
                        </span>
                      </label>
                      {photoBase64 && (
                        <img
                          src={photoBase64}
                          alt="preview"
                          className="w-12 h-12 object-cover rounded-lg border border-stone-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Canvas Signature Drawer */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                        <Signature className="w-3.5 h-3.5" /> Firma del Cliente
                      </label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[10px] text-purple-600 hover:text-purple-700 font-bold min-h-[30px]"
                      >
                        Limpiar firma
                      </button>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={350}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-28 bg-stone-100 border border-stone-200 rounded-lg block cursor-pointer touch-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Motivo del rechazo / falla</label>
                  <select
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    required
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400 min-h-[44px]"
                  >
                    <option value="">Selecciona motivo...</option>
                    <option value={IncidentType.ClienteAusente}>Cliente Ausente</option>
                    <option value={IncidentType.DireccionIncorrecta}>Dirección Incorrecta</option>
                    <option value={IncidentType.RechazoEntrega}>Rechazo de Entrega</option>
                    <option value={IncidentType.Otro}>Otro Motivo Técnico</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-stone-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-4 rounded-xl border border-stone-200 transition min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs bg-purple-900 hover:bg-purple-800 text-stone-100 font-bold py-3 px-4 rounded-xl transition min-h-[44px]"
                >
                  Guardar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT NOVEDAD DRAWER */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-end justify-center backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 shadow-2xl">
            <h4 className="font-bold text-stone-900 text-base border-b border-stone-150 pb-3 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-500" /> Reportar Novedad de Ruta
            </h4>

            <form onSubmit={handleRegisterIncident} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Tipo de Novedad</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none min-h-[44px]"
                >
                  <option value={IncidentType.Trafico}>Tráfico Pesado / Trancón</option>
                  <option value={IncidentType.VehiculoVarado}>Vehículo Varado / Falla Mecánica</option>
                  <option value={IncidentType.Accidente}>Accidente Vial</option>
                  <option value={IncidentType.Otro}>Otro / Retraso General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Descripción corta</label>
                <textarea
                  required
                  rows={3}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Detalle de la novedad para coordinadores logísticos..."
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center gap-3 border-t border-stone-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-4 rounded-xl border border-stone-200 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px]"
                >
                  Enviar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
