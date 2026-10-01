/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Vehicle, VehicleStatus, Driver } from "../types";
import { Search, Plus, Edit, ShieldAlert, Truck } from "lucide-react";

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [plate, setPlate] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(1000);
  const [status, setStatus] = useState<VehicleStatus>(VehicleStatus.Disponible);
  const [assignedDriverId, setAssignedDriverId] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setVehicles(DbService.getVehicles());
    setDrivers(DbService.getDrivers());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setPlate("");
    setType("Turbo NHR");
    setBrand("");
    setModel("");
    setCapacity(1000);
    setStatus(VehicleStatus.Disponible);
    setAssignedDriverId("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setPlate(vehicle.plate);
    setType(vehicle.type);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setCapacity(vehicle.capacity);
    setStatus(vehicle.status);
    setAssignedDriverId(vehicle.assignedDriverId || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!plate || !type || !brand || !capacity) {
      setFormError("Por favor ingresa los campos obligatorios.");
      return;
    }

    try {
      if (editingVehicle) {
        DbService.updateVehicle(editingVehicle.id, {
          plate,
          type,
          brand,
          model,
          capacity: Number(capacity),
          status,
          assignedDriverId: assignedDriverId || undefined
        });
      } else {
        DbService.createVehicle({
          plate,
          type,
          brand,
          model,
          capacity: Number(capacity),
          status,
          assignedDriverId: assignedDriverId || undefined
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    return (
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="vehicles-list-container">
      {/* List panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-stone-600" /> Parque Automotor / Vehículos
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Controla la capacidad de carga, placas, estado de mantenimiento e historial GPS.</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition border border-purple-800"
          >
            <Plus className="w-4 h-4" /> Registrar Vehículo
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por placa, marca de chasis, o tipo (ej. Furgón, Turbo)..."
            className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50"
          />
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                <th className="py-3 px-4">Placa / Identificador</th>
                <th className="py-3 px-4">Clase / Tipo</th>
                <th className="py-3 px-4">Marca & Modelo</th>
                <th className="py-3 px-4">Capacidad de Carga</th>
                <th className="py-3 px-4">Conductor Vinculado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const assignedDrv = drivers.find((d) => d.id === v.assignedDriverId);

                let badgeColor = "text-stone-600";
                if (v.status === VehicleStatus.Disponible) badgeColor = "text-blue-600";
                else if (v.status === VehicleStatus.EnRuta) badgeColor = "text-emerald-600";
                else if (v.status === VehicleStatus.Mantenimiento) badgeColor = "text-amber-600";

                return (
                  <tr key={v.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 tracking-wider">
                      {v.plate}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-medium">{v.type}</td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {v.brand} <span className="text-stone-400">({v.model})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-700">
                      {v.capacity.toLocaleString()} kg
                    </td>
                    <td className="py-3.5 px-4">
                      {assignedDrv ? (
                        <span className="text-xs font-medium text-stone-800">
                          {assignedDrv.name}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold ${badgeColor}`}>{v.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="text-stone-700 hover:text-stone-900 font-semibold text-xs border border-stone-200 hover:bg-stone-50 p-1.5 rounded-lg inline-flex items-center gap-1 transition"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Sidebar panel */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        {isFormOpen ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="font-sans font-semibold text-stone-900 text-base border-b border-stone-150 pb-3">
              {editingVehicle ? "Modificar Ficha Vehículo" : "Registrar Ficha Vehículo"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Número de Placa *</label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="Ej. SZK-980"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Clase / Tipo *</label>
                  <input
                    type="text"
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Ej. Turbo NHR"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Capacidad (kg) *</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    placeholder="Ej. 3500"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Marca de Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Chevrolet"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Modelo / Año</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. 2023"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Conductor Habitual Vinculado</label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                >
                  <option value="">Sin conductor asignado</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Estado de Servicio</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                >
                  <option value={VehicleStatus.Disponible}>{VehicleStatus.Disponible}</option>
                  <option value={VehicleStatus.EnRuta}>{VehicleStatus.EnRuta}</option>
                  <option value={VehicleStatus.Mantenimiento}>{VehicleStatus.Mantenimiento}</option>
                  <option value={VehicleStatus.Inactivo}>{VehicleStatus.Inactivo}</option>
                </select>
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
            Selecciona un vehículo a la izquierda para inspeccionar capacidad, placa, conductor vinculado o cambiar el estado mecánico.
          </div>
        )}
      </div>
    </div>
  );
}
