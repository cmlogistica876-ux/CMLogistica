/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "../services/db";
import { Client, UserStatus } from "../types";
import { Search, Plus, Edit, ShieldAlert, Building } from "lucide-react";

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState<string>("");
  const [taxId, setTaxId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [status, setStatus] = useState<UserStatus>(UserStatus.Activo);

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setClients(DbService.getClients());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setName("");
    setTaxId("");
    setAddress("");
    setCity("Bogotá");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setStatus(UserStatus.Activo);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setTaxId(client.taxId);
    setAddress(client.address);
    setCity(client.city);
    setContactName(client.contactName);
    setContactPhone(client.contactPhone);
    setContactEmail(client.contactEmail);
    setStatus(client.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !taxId || !address || !contactName || !contactEmail) {
      setFormError("Por favor ingresa los campos obligatorios.");
      return;
    }

    try {
      if (editingClient) {
        DbService.updateClient(editingClient.id, {
          name,
          taxId,
          address,
          city,
          contactName,
          contactPhone,
          contactEmail,
          status
        });
      } else {
        DbService.createClient({
          name,
          taxId,
          address,
          city,
          contactName,
          contactPhone,
          contactEmail,
          status
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const filteredClients = clients.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.taxId.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="clients-list-container">
      {/* List panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
          <div>
            <h3 className="font-sans font-semibold text-stone-900 text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-stone-600" /> Registro de Clientes Corporativos
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Controla NIT, direcciones de recibo de mercancías y contactos de despachos.</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition border border-purple-800"
          >
            <Plus className="w-4 h-4" /> Registrar Cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por razón social, NIT o ciudad principal..."
            className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50"
          />
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                <th className="py-3 px-4">Cliente / NIT</th>
                <th className="py-3 px-4">Dirección Principal</th>
                <th className="py-3 px-4">Ciudad</th>
                <th className="py-3 px-4">Contacto de Logística</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                  <td className="py-3.5 px-4 font-semibold text-stone-800">
                    <div>
                      {c.name}
                      <span className="text-[10px] text-stone-400 font-mono block mt-0.5">NIT: {c.taxId}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 truncate max-w-[150px]" title={c.address}>
                    {c.address}
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">{c.city}</td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-stone-700">
                      <strong>{c.contactName}</strong>
                      <span className="block text-[10px] text-stone-400 font-mono">{c.contactPhone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold ${
                        c.status === UserStatus.Activo ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="text-stone-700 hover:text-stone-900 font-semibold text-xs border border-stone-200 hover:bg-stone-50 p-1.5 rounded-lg inline-flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor sidebar */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        {isFormOpen ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="font-sans font-semibold text-stone-900 text-base border-b border-stone-150 pb-3">
              {editingClient ? "Modificar Ficha Cliente" : "Registrar Ficha Cliente"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Almacenes Éxito S.A."
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">NIT / Documento *</label>
                  <input
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Ej. 890.900.608-9"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Ciudad Matriz *</label>
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
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Dirección Principal *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Carrera 48 # 32B Sur - 139"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                />
              </div>

              <hr className="border-stone-150" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Datos del Contacto</h4>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej. Juan Pablo Urrego"
                  className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Celular *</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej. +57 320 111 2233"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Ej. exito@logistica.com"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50"
                  />
                </div>
              </div>

              {editingClient && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Estado de Cuenta</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="inline-flex items-center gap-1 text-sm text-stone-700">
                      <input
                        type="radio"
                        name="status"
                        checked={status === UserStatus.Activo}
                        onChange={() => setStatus(UserStatus.Activo)}
                      />{" "}
                      Activo
                    </label>
                    <label className="inline-flex items-center gap-1 text-sm text-stone-700">
                      <input
                        type="radio"
                        name="status"
                        checked={status === UserStatus.Inactivo}
                        onChange={() => setStatus(UserStatus.Inactivo)}
                      />{" "}
                      Inactivo
                    </label>
                  </div>
                </div>
              )}

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
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center gap-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <Building className="w-12 h-12 text-stone-300 animate-pulse" />
            <div>
              <p className="text-sm text-stone-700 font-semibold">¿Necesitas agregar un cliente?</p>
              <p className="text-xs text-stone-500 mt-1">Crea nuevos perfiles corporativos para asignarles despachos en tus rutas.</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow-sm border border-purple-800"
            >
              <Plus className="w-4 h-4" /> Crear Nuevo Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
