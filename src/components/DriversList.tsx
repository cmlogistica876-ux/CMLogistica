/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Driver, DriverStatus, Vehicle } from "../types";
import { Search, Plus, Edit, ShieldAlert, Award } from "lucide-react";

export default function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState<string>("");
  const [documentVal, setDocumentVal] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [status, setStatus] = useState<DriverStatus>(DriverStatus.Disponible);
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setDrivers(DbService.getDrivers());
    setVehicles(DbService.getVehicles());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setName("");
    setDocumentVal("");
    setPhone("");
    setEmail("");
    setLicenseNumber("");
    setStatus(DriverStatus.Disponible);
    setAssignedVehicleId("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setDocumentVal(driver.document);
    setPhone(driver.phone);
    setEmail(driver.email);
    setLicenseNumber(driver.licenseNumber);
    setStatus(driver.status);
    setAssignedVehicleId(driver.assignedVehicleId || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !documentVal || !email || !licenseNumber) {
      setFormError("Por favor ingresa los campos requeridos (Nombre, Cédula, Correo, Licencia).");
      return;
    }

    try {
      if (editingDriver) {
        DbService.updateDriver(editingDriver.id, {
          name,
          document: documentVal,
          phone,
          email,
          licenseNumber,
          status,
          assignedVehicleId: assignedVehicleId || undefined
        });
      } else {
        DbService.createDriver({
          name,
          document: documentVal,
          phone,
          email,
          licenseNumber,
          status,
          assignedVehicleId: assignedVehicleId || undefined
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    return (
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.document.includes(searchQuery) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="drivers-list-container">
      {/* List Panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-stone-600" /> Registro de Conductores Logísticos
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">Administra operadores de transporte, licencias de conducción y camiones vinculados.</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow-sm border border-purple-800"
          >
            <Plus className="w-4 h-4" /> Registrar Conductor
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, cédula / NIT, o licencia de tránsito..."
            className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50"
          />
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Cédula</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Vehículo Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((d) => {
                const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);

                let badgeColor = "text-stone-600";
                if (d.status === DriverStatus.Disponible) badgeColor = "text-blue-600";
                else if (d.status === DriverStatus.EnRuta) badgeColor = "text-emerald-600";
                else if (d.status === DriverStatus.Suspendido) badgeColor = "text-rose-600";

                return (
                  <tr key={d.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      <div>
                        {d.name}
                        <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Licencia: {d.licenseNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">{d.document}</td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">{d.phone}</td>
                    <td className="py-3.5 px-4">
                      {assignedVeh ? (
                        <span className="text-xs font-mono font-bold text-stone-800 bg-stone-100 py-0.5 px-1.5 rounded-md">
                          {assignedVeh.plate} ({assignedVeh.type})
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold ${badgeColor}`}>{d.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(d)}
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

      {/* Editor sidebar Panel */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        {isFormOpen ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="font-sans font-semibold text-stone-900 text-base border-b border-stone-150 pb-3">
              {editingDriver ? "Modificar Ficha Conductor" : "Registrar Ficha Conductor"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Carlos Beltrán"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    required
                    value={documentVal}
                    onChange={(e) => setDocumentVal(e.target.value)}
                    placeholder="Ej. 79888123"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Nº Licencia de Tránsito *</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Ej. C2-79888123"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej. juan.beltran@rutatrack.co"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Celular / Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +57 311 444 5566"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Vehículo de Carga Vinculado</label>
                <select
                  value={assignedVehicleId}
                  onChange={(e) => setAssignedVehicleId(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                >
                  <option value="">Ningún vehículo asignado</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.type} - {v.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Estado de Disponibilidad</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DriverStatus)}
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                >
                  <option value={DriverStatus.Disponible}>{DriverStatus.Disponible}</option>
                  <option value={DriverStatus.EnRuta}>{DriverStatus.EnRuta}</option>
                  <option value={DriverStatus.Inactivo}>{DriverStatus.Inactivo}</option>
                  <option value={DriverStatus.Suspendido}>{DriverStatus.Suspendido}</option>
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
            Selecciona un conductor a la izquierda para modificar su licencia, placa asignada, o cambiar su disponibilidad operativa en el sistema.
          </div>
        )}
      </div>
    </div>
  );
}
