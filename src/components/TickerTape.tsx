/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DbService } from "../services/db";
import { Delivery, Incident, DeliveryStatus, RouteStatus } from "../types";
import { AlertCircle, Clock, Calendar, ChevronLeft, ChevronRight, Pause, Play, Filter } from "lucide-react";

interface TickerItem {
  id: string;
  deliveryId?: string;
  date: string;         // [Fecha de entrega]
  timeWindow: string;   // [Ventana horaria]
  code: string;         // Número Pedido
  novelty: string;      // Novedad
  isDelay?: boolean;
  rawReportDate: string; // Fecha de reporte para filtrado (YYYY-MM-DD)
}

interface TickerTapeProps {
  onSelectDelivery?: (id: string) => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    // Convierte YYYY-MM-DD a DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function TickerTape({ onSelectDelivery }: TickerTapeProps) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [filterRange, setFilterRange] = useState<"todos" | "anio" | "mes" | "hoy">("todos");
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftVal, setScrollLeftVal] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollSpeed = 0.6; // Pixels per frame

  const loadTickerData = () => {
    const incidents = DbService.getIncidents();
    const deliveries = DbService.getDeliveries();

    const list: TickerItem[] = [];
    const seenDeliveryIds = new Set<string>();

    // 1. Process active incidents / novedades
    incidents.forEach((inc) => {
      if (inc.deliveryId) {
        const del = deliveries.find((d) => d.id === inc.deliveryId);
        if (del) {
          // Exclude closed or completed deliveries
          if (del.status === DeliveryStatus.Entregada || del.status === DeliveryStatus.Cancelada) {
            return;
          }

          seenDeliveryIds.add(del.id);
          const date = formatDate(del.scheduledDate);
          const timeWindow = del.timeWindowStart && del.timeWindowEnd
            ? `${del.timeWindowStart} - ${del.timeWindowEnd}`
            : (del.timeWindowStart || "08:00 - 18:00");

          list.push({
            id: inc.id,
            deliveryId: del.id,
            date,
            timeWindow,
            code: del.code,
            novelty: inc.description || inc.type,
            isDelay: inc.type === "Tráfico pesado" || inc.description.toLowerCase().includes("retraso") || inc.description.toLowerCase().includes("trancón"),
            rawReportDate: inc.createdAt.substring(0, 10)
          });
        }
      } else {
        // Route-level incident
        const route = DbService.getRoutes().find(r => r.id === inc.routeId);
        // Exclude if route is closed (Finalizada or Cancelada)
        if (route && (route.status === RouteStatus.Finalizada || route.status === RouteStatus.Cancelada)) {
          return;
        }

        const date = formatDate(inc.createdAt.substring(0, 10));
        const timeWindow = inc.createdAt.substring(11, 16);
        list.push({
          id: inc.id,
          date,
          timeWindow,
          code: `Ruta ${inc.routeId.replace("rt-", "#")}`,
          novelty: inc.description || inc.type,
          isDelay: true,
          rawReportDate: inc.createdAt.substring(0, 10)
        });
      }
    });

    // 2. Process other failed or delayed deliveries not in active incidents
    deliveries.forEach((del) => {
      if (seenDeliveryIds.has(del.id)) return;

      // Exclude closed or completed deliveries
      if (del.status === DeliveryStatus.Entregada || del.status === DeliveryStatus.Cancelada) {
        return;
      }

      if (del.status === DeliveryStatus.Fallida || del.status === DeliveryStatus.Reprogramada) {
        const date = formatDate(del.scheduledDate);
        const timeWindow = del.timeWindowStart && del.timeWindowEnd
          ? `${del.timeWindowStart} - ${del.timeWindowEnd}`
          : (del.timeWindowStart || "08:00 - 18:00");

        list.push({
          id: del.id,
          deliveryId: del.id,
          date,
          timeWindow,
          code: del.code,
          novelty: del.failureReason || (del.status === DeliveryStatus.Reprogramada ? "Entrega reprogramada" : "Intento de entrega fallido"),
          isDelay: del.status === DeliveryStatus.Reprogramada,
          rawReportDate: del.scheduledDate || del.createdAt.substring(0, 10)
        });
      }
    });

    // Sort items by date & time window so they show sequentially
    list.sort((a, b) => (a.date + " " + a.timeWindow).localeCompare(b.date + " " + b.timeWindow));

    setItems(list);
  };

  useEffect(() => {
    loadTickerData();
    const unsubscribe = DbService.subscribeToDb(loadTickerData);
    return () => unsubscribe();
  }, []);

  // Filter items according to select filterRange
  const filteredItems = items.filter((item) => {
    if (filterRange === "todos") return true;

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');

    if (!item.rawReportDate) return false;
    const [itemYear, itemMonth, itemDay] = item.rawReportDate.split("-");

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

  // Prepare scrollable array with fallback if it is empty
  const displayList = [...filteredItems];
  if (displayList.length === 0) {
    const todayStr = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
    const nowStr = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
    
    let msg = "Monitoreo RutaTrack: Sin novedades ni alertas registradas.";
    if (filterRange === "hoy") msg = "Monitoreo RutaTrack: Sin novedades para el día de hoy.";
    else if (filterRange === "mes") msg = "Monitoreo RutaTrack: Sin novedades registradas este mes.";
    else if (filterRange === "anio") msg = "Monitoreo RutaTrack: Sin novedades registradas este año.";

    displayList.push({
      id: "healthy-fallback",
      date: todayStr,
      timeWindow: nowStr,
      code: "SISTEMA",
      novelty: msg,
      isDelay: false,
      rawReportDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    });
  }

  // Frame-by-frame auto-scroll mechanism using requestAnimationFrame
  useEffect(() => {
    const container = viewportRef.current;
    if (!container || isPaused || isDragging) return;

    let animationFrameId: number;

    const scroll = () => {
      if (!container) return;
      container.scrollLeft += scrollSpeed;

      // Wrap around seamlessly when we reach halfway (since we duplicated items)
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, isDragging, displayList.length]);

  // Drag-to-scroll implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = viewportRef.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeftVal(container.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = viewportRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity multiplier
    let newScrollLeft = scrollLeftVal - walk;

    // Boundary wrapping for seamless feel during drag
    const halfWidth = container.scrollWidth / 2;
    if (newScrollLeft >= halfWidth) {
      newScrollLeft = 0;
    } else if (newScrollLeft < 0) {
      newScrollLeft = halfWidth - 1;
    }

    container.scrollLeft = newScrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  // Manual scroll buttons
  const scrollManual = (direction: "left" | "right") => {
    const container = viewportRef.current;
    if (!container) return;

    // Temporarily pause auto-scroll to allow the user to view their chosen spot
    setIsPaused(true);

    const step = 250; // Pixels to scroll
    const target = container.scrollLeft + (direction === "right" ? step : -step);

    container.scrollTo({
      left: target,
      behavior: "smooth",
    });

    // Wrapped bounds correction after smooth scroll completes
    setTimeout(() => {
      if (!container) return;
      const halfWidth = container.scrollWidth / 2;
      if (container.scrollLeft >= halfWidth) {
        container.scrollLeft = container.scrollLeft - halfWidth;
      } else if (container.scrollLeft <= 0) {
        container.scrollLeft = halfWidth + container.scrollLeft;
      }
    }, 400);
  };

  const handleItemClick = (deliveryId?: string) => {
    if (deliveryId && onSelectDelivery) {
      onSelectDelivery(deliveryId);
    }
  };

  return (
    <>
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div 
        className="bg-purple-950 text-white border-t border-purple-900 h-10 shrink-0 flex items-center overflow-hidden text-xs select-none shadow-[0_-2px_10px_rgba(0,0,0,0.15)] z-40 relative" 
        id="rutatrack-ticker-bar"
      >
        {/* Fixed Title Label */}
        <div className="bg-purple-900 px-4 h-full flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-200 border-r border-purple-800/80 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.2)] z-20">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-[11px] whitespace-nowrap">Monitoreo de Novedades</span>
        </div>

        {/* Filters Dropdown */}
        <div className="flex items-center gap-1.5 px-3 h-full border-r border-purple-800/80 bg-purple-950 shrink-0 z-20">
          <Filter className="w-3.5 h-3.5 text-purple-300" />
          <select
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value as any)}
            className="bg-purple-900 hover:bg-purple-850 text-purple-100 text-[11px] font-bold border border-purple-800 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition duration-150"
            id="ticker-time-filter"
          >
            <option value="todos" className="bg-purple-950 text-white font-sans">Todas</option>
            <option value="anio" className="bg-purple-950 text-white font-sans">Este año</option>
            <option value="mes" className="bg-purple-950 text-white font-sans">Este mes</option>
            <option value="hoy" className="bg-purple-950 text-white font-sans">Hoy</option>
          </select>
        </div>

        {/* Action Controls Toolbar (Play/Pause, Manual scrolling) */}
        <div className="flex items-center h-full border-r border-purple-800/50 bg-purple-950/80 shrink-0 px-2 gap-1 z-20">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded hover:bg-purple-800/50 text-purple-300 transition duration-150 ${isPaused ? "bg-amber-900/30 text-amber-300 hover:bg-amber-900/50" : ""}`}
            title={isPaused ? "Reanudar auto-desplazamiento" : "Pausar auto-desplazamiento"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => scrollManual("left")}
            className="p-1 rounded hover:bg-purple-800/50 text-purple-300 transition duration-150"
            title="Mover a la izquierda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => scrollManual("right")}
            className="p-1 rounded hover:bg-purple-800/50 text-purple-300 transition duration-150"
            title="Mover a la derecha"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrolling content viewport */}
        <div 
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onMouseEnter={() => setIsPaused(true)}
          className={`flex-1 overflow-x-auto scrollbar-none relative flex items-center h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {/* We repeat the array twice to make the scrolling seamless and infinite */}
          <div className="flex w-max items-center">
            {/* Set 1 */}
            <div className="flex items-center gap-16 pr-16 font-medium text-stone-100">
              {displayList.map((item, index) => {
                const clickable = !!item.deliveryId && !!onSelectDelivery && item.id !== "healthy-fallback";
                return (
                  <div
                    key={`${item.id}-set1-${index}`}
                    onClick={() => clickable && handleItemClick(item.deliveryId)}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      clickable ? "cursor-pointer hover:bg-purple-900/40 px-2 py-1 rounded-md transition duration-150 group" : ""
                    }`}
                    title={clickable ? `Ver expediente de la orden ${item.code}` : undefined}
                  >
                    <span className="text-purple-300 font-bold bg-purple-900/60 py-0.5 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 border border-purple-800/50 group-hover:border-purple-600 transition">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {item.date}
                    </span>
                    <span className="text-purple-300 font-bold bg-purple-900/60 py-0.5 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 border border-purple-800/50 group-hover:border-purple-600 transition">
                      <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {item.timeWindow}
                    </span>
                    <span className={`font-bold text-white tracking-tight ${clickable ? "group-hover:underline text-purple-200" : ""}`}>{item.code}:</span>
                    <span className={`${item.isDelay ? "text-amber-300" : "text-rose-300"} font-semibold`}>
                      {item.novelty}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Set 2 (Identical duplicate for seamless snapping) */}
            <div className="flex items-center gap-16 pr-16 font-medium text-stone-100">
              {displayList.map((item, index) => {
                const clickable = !!item.deliveryId && !!onSelectDelivery && item.id !== "healthy-fallback";
                return (
                  <div
                    key={`${item.id}-set2-${index}`}
                    onClick={() => clickable && handleItemClick(item.deliveryId)}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      clickable ? "cursor-pointer hover:bg-purple-900/40 px-2 py-1 rounded-md transition duration-150 group" : ""
                    }`}
                    title={clickable ? `Ver expediente de la orden ${item.code}` : undefined}
                  >
                    <span className="text-purple-300 font-bold bg-purple-900/60 py-0.5 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 border border-purple-800/50 group-hover:border-purple-600 transition">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {item.date}
                    </span>
                    <span className="text-purple-300 font-bold bg-purple-900/60 py-0.5 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 border border-purple-800/50 group-hover:border-purple-600 transition">
                      <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {item.timeWindow}
                    </span>
                    <span className={`font-bold text-white tracking-tight ${clickable ? "group-hover:underline text-purple-200" : ""}`}>{item.code}:</span>
                    <span className={`${item.isDelay ? "text-amber-300" : "text-rose-300"} font-semibold`}>
                      {item.novelty}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
