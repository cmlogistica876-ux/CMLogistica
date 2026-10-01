/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService, SYSTEM_MODULES } from "../services/db";
import { User, UserStatus, CustomRole, RoleModulePermission } from "../types";
import {
  Users,
  Search,
  Plus,
  Edit,
  Check,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Lock,
  Eye,
  Edit2,
  Info,
  X
} from "lucide-react";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation tabs: "usuarios" or "roles"
  const [activeSubTab, setActiveSubTab] = useState<"usuarios" | "roles">("usuarios");

  const [searchQuery, setSearchQuery] = useState<string>("");

  // User Form states
  const [isUserFormOpen, setIsUserFormOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Conductor");
  const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.Activo);
  const [driverId, setDriverId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(true);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Role Form states
  const [isRoleFormOpen, setIsRoleFormOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState<string>("");
  const [roleDescription, setRoleDescription] = useState<string>("");
  const [rolePermissions, setRolePermissions] = useState<RoleModulePermission[]>([]);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  const loadData = () => {
    setUsers(DbService.getUsers());
    const currentRoles = DbService.getRoles();
    setRoles(currentRoles);
    setCurrentUser(DbService.getCurrentUser());

    // If default role doesn't exist in current roles, default to first available
    if (currentRoles.length > 0 && !currentRoles.some(r => r.name === userRole)) {
      setUserRole(currentRoles[0].name);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  // --- USER FORM ACTIONS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setDisplayName("");
    setEmail("");
    setPhone("");
    // Default to 'Conductor' or first available role
    const defaultRole = roles.find(r => r.name.toLowerCase().includes("conductor"))?.name || roles[0]?.name || "Conductor";
    setUserRole(defaultRole);
    setUserStatus(UserStatus.Activo);
    setDriverId("");
    setClientId("");
    setUsername("");
    setPassword("");
    setMustChangePassword(true);
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setDisplayName(user.displayName);
    setEmail(user.email);
    setPhone(user.phone || "");
    setUserRole(user.role);
    setUserStatus(user.status);
    setDriverId(user.driverId || "");
    setClientId(user.clientId || "");
    setUsername(user.username || "");
    setPassword(user.password || "");
    setMustChangePassword(user.mustChangePassword || false);
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (!displayName || !email) {
      setUserFormError("Por favor ingresa los campos requeridos (Nombre y Correo).");
      return;
    }

    try {
      if (editingUser) {
        DbService.updateUser(editingUser.uid, {
          displayName,
          email,
          phone: phone || undefined,
          role: userRole,
          status: userStatus,
          driverId: driverId || undefined,
          clientId: clientId || undefined,
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          mustChangePassword
        });
      } else {
        DbService.createUser({
          displayName,
          email,
          phone: phone || undefined,
          role: userRole,
          status: userStatus,
          driverId: driverId || undefined,
          clientId: clientId || undefined,
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          mustChangePassword
        });
      }
      setIsUserFormOpen(false);
    } catch (err: any) {
      setUserFormError(err.message || "Error al guardar el usuario.");
    }
  };

  // --- ROLE FORM ACTIONS ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    // Initialize empty permission list for all modules
    const initialPerms: RoleModulePermission[] = SYSTEM_MODULES.map((mod) => ({
      moduleId: mod.id,
      moduleLabel: mod.label,
      enabled: false,
      accessType: "read"
    }));
    setRolePermissions(initialPerms);
    setRoleFormError(null);
    setIsRoleFormOpen(true);
  };

  const handleOpenEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    
    // Ensure we have a permission object for all system modules (backward compatible)
    const normalizedPerms = SYSTEM_MODULES.map((mod) => {
      const existing = role.permissions.find((p) => p.moduleId === mod.id);
      return existing
        ? { ...existing }
        : { moduleId: mod.id, moduleLabel: mod.label, enabled: false, accessType: "read" as const };
    });

    setRolePermissions(normalizedPerms);
    setRoleFormError(null);
    setIsRoleFormOpen(true);
  };

  const handleTogglePermission = (moduleId: string) => {
    setRolePermissions((prev) =>
      prev.map((p) => (p.moduleId === moduleId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleChangePermissionType = (moduleId: string, accessType: "read" | "edit") => {
    setRolePermissions((prev) =>
      prev.map((p) => (p.moduleId === moduleId ? { ...p, accessType } : p))
    );
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRoleFormError(null);

    if (!roleName.trim()) {
      setRoleFormError("Por favor ingresa un nombre para el rol.");
      return;
    }

    try {
      if (editingRole) {
        DbService.updateRole(editingRole.id, {
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        });
      } else {
        DbService.createRole({
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        });
      }
      setIsRoleFormOpen(false);
    } catch (err: any) {
      setRoleFormError(err.message || "Error al procesar el rol.");
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.")) {
      try {
        DbService.deleteRole(roleId);
        setIsRoleFormOpen(false);
      } catch (err: any) {
        alert(err.message || "Error al eliminar el rol.");
      }
    }
  };

  // --- FILTERS ---
  const filteredUsers = users.filter((u) => {
    return (
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getActiveModuleNames = (role: CustomRole) => {
    const active = role.permissions.filter((p) => p.enabled);
    if (active.length === 0) return "Ninguno";
    if (active.length === role.permissions.length) return "Todos los módulos";
    return active.map((p) => p.moduleLabel).join(", ");
  };

  return (
    <div className="flex flex-col gap-5" id="control-usuarios-root">
      {/* Dynamic Tab Selector */}
      <div className="flex border-b border-stone-200" id="users-roles-navigation-tabs">
        <button
          onClick={() => {
            setActiveSubTab("usuarios");
            setSearchQuery("");
          }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeSubTab === "usuarios"
              ? "border-purple-900 text-purple-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios y Cuentas ({users.length})
        </button>
        <button
          onClick={() => {
            setActiveSubTab("roles");
            setSearchQuery("");
          }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeSubTab === "roles"
              ? "border-purple-900 text-purple-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles y Permisos Dinámicos ({roles.length})
        </button>
      </div>

      {activeSubTab === "usuarios" ? (
        /* ==================== TAB: USUARIOS ==================== */
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4" id="users-tab-layout">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-900" /> Registro de Usuarios Operativos
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Asigna credenciales y asocia conductores o clientes a sus cuentas del sistema.</p>
            </div>

            {currentUser?.role.toLowerCase().includes("admin") && (
              <button
                onClick={handleOpenCreateUser}
                className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow-sm border border-purple-800"
              >
                <Plus className="w-4 h-4" /> Registrar Usuario
              </button>
            )}
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, correo electrónico o rol..."
              className="w-full text-sm border border-stone-200 rounded-lg pl-9 pr-4 py-2 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isMe = currentUser?.uid === u.uid;
                  const canEdit = currentUser?.role.toLowerCase().includes("admin") || isMe;

                  return (
                    <tr key={u.uid} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {u.displayName}
                            {isMe && (
                              <span className="text-[9px] bg-cyan-100 text-cyan-700 font-bold px-1.5 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                          </span>
                          {u.username ? (
                            <span className="text-[10px] text-purple-700 font-semibold mt-0.5" title="Usuario de inicio de sesión personalizado">
                              @{u.username}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic mt-0.5">
                              Sin usuario personalizado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">
                        <div className="flex flex-col">
                          <span>{u.email}</span>
                          {u.password && (
                            <span className="text-[10px] text-stone-500 font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                              Clave: {u.password}
                              {u.mustChangePassword && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-full border border-amber-200" title="Debe cambiar clave al ingresar">
                                  Pte. Cambio
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold bg-purple-50 text-purple-950 py-1 px-2.5 rounded-md border border-purple-100">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold ${
                            u.status === UserStatus.Activo ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canEdit ? (
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="text-stone-700 hover:text-stone-900 font-semibold text-xs border border-stone-200 hover:bg-stone-50 p-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>
                        ) : (
                          <span className="text-xs text-stone-400 italic">No permitido</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== TAB: ROLES Y PERMISOS ==================== */
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4" id="roles-tab-layout">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-150 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-stone-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-900" /> Administración de Roles & Permisos
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 font-sans">
                Define qué módulos del sistema están visibles para cada rol, y si tienen permisos de solo lectura o edición completa.
              </p>
            </div>

            {currentUser?.role.toLowerCase().includes("admin") && (
              <button
                onClick={handleOpenCreateRole}
                className="bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow-sm border border-purple-800"
              >
                <Plus className="w-4 h-4" /> Crear Nuevo Rol
              </button>
            )}
          </div>

          {/* Roles table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-150 text-xs font-semibold text-stone-500 bg-stone-50">
                  <th className="py-3 px-4">Nombre del Rol</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Módulos Permitidos</th>
                  <th className="py-3 px-4">Asignaciones</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const userCount = users.filter((u) => u.role === r.name).length;
                  const canDelete = !r.isSystem && userCount === 0;

                  return (
                    <tr key={r.id} className="border-b border-stone-150 hover:bg-stone-50 text-sm">
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        <div className="flex items-center gap-1.5">
                          {r.name}
                          {r.isSystem && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded border border-stone-200"
                              title="Rol de sistema predeterminado"
                            >
                              <Lock className="w-2.5 h-2.5" /> Sistema
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600 max-w-[200px] truncate" title={r.description}>
                        {r.description || "Sin descripción."}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className="bg-stone-100 font-medium text-stone-700 py-1 px-2 rounded cursor-help border border-stone-150"
                          title={getActiveModuleNames(r)}
                        >
                          {r.permissions.filter((p) => p.enabled).length} de {SYSTEM_MODULES.length} habilitados
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-stone-600">
                        {userCount} {userCount === 1 ? "usuario" : "usuarios"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditRole(r)}
                            className="text-purple-900 hover:text-purple-750 font-semibold text-xs border border-purple-200 hover:bg-purple-50 p-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Configurar
                          </button>
                          {!r.isSystem && (
                            <button
                              onClick={() => handleDeleteRole(r.id)}
                              disabled={!canDelete}
                              className={`p-1.5 rounded-lg border inline-flex items-center transition ${
                                canDelete
                                  ? "text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                  : "text-stone-300 border-stone-100 cursor-not-allowed"
                              }`}
                              title={
                                userCount > 0
                                  ? "No se puede eliminar un rol asignado a usuarios"
                                  : "Eliminar este rol personalizado"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FORMULARIO DE USUARIO ==================== */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-scale-up" id="user-editor-form-wrapper">
            {/* Header */}
            <div className="p-5 border-b border-stone-150 flex items-center justify-between">
              <h3 className="font-sans font-bold text-stone-950 text-base">
                {editingUser ? "Modificar Parámetros de Usuario" : "Registrar Nuevo Usuario"}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserFormOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {userFormError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> {userFormError}
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Diana Restrepo"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. diana.restrepo@rutatrack.co"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Celular / Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +57 310 987 6543"
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Rol Operativo</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-stone-150 pt-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Usuario (Login) <span className="text-stone-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                      placeholder="Ej. diana.restrepo"
                      className="w-full text-xs border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none font-mono text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Contraseña <span className="text-stone-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ej. Isabella3105"
                      className="w-full text-xs border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none font-mono text-stone-800"
                    />
                  </div>
                </div>

                {/* Option to force password change */}
                {(username || password) && (
                  <div className="flex items-center gap-2 bg-purple-50 p-2.5 rounded-lg border border-purple-100 animate-fade-in">
                    <input
                      type="checkbox"
                      id="mustChangePassword"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="w-4 h-4 text-purple-900 border-stone-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <label
                      htmlFor="mustChangePassword"
                      className="text-xs font-semibold text-purple-950 select-none cursor-pointer"
                    >
                      Exigir cambio de contraseña en el primer ingreso
                    </label>
                  </div>
                )}

                {/* Context-aware additional IDs if name matches Conductor or Cliente */}
                {(userRole.toLowerCase().includes("conductor") || userRole.toLowerCase().includes("transportador")) && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">ID Conductor Asociado (Opcional)</label>
                    <input
                      type="text"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      placeholder="Ej. drv-1"
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900"
                    />
                  </div>
                )}

                {userRole.toLowerCase().includes("cliente") && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">ID Cliente Asociado (Opcional)</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Ej. cli-1"
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900"
                    />
                  </div>
                )}

                {editingUser && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Estado de Acceso</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="inline-flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          checked={userStatus === UserStatus.Activo}
                          onChange={() => setUserStatus(UserStatus.Activo)}
                        />
                        Activo
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          checked={userStatus === UserStatus.Inactivo}
                          onChange={() => setUserStatus(UserStatus.Inactivo)}
                        />
                        Inactivo
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 border-t border-stone-150 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsUserFormOpen(false)}
                    className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-lg border border-stone-200 transition font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 text-xs bg-purple-950 hover:bg-purple-900 text-stone-100 font-semibold py-2.5 rounded-lg transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FORMULARIO DE ROL ==================== */}
      {isRoleFormOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-scale-up" id="role-editor-form-wrapper">
            {/* Header */}
            <div className="p-5 border-b border-stone-150 flex items-center justify-between">
              <h3 className="font-sans font-bold text-stone-950 text-base flex items-center gap-2">
                <span>{editingRole ? "Modificar Rol" : "Nuevo Rol Personalizado"}</span>
                {editingRole?.isSystem && (
                  <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Solo Permisos
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleFormOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {roleFormError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> {roleFormError}
                </div>
              )}

              <form onSubmit={handleRoleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Nombre del Rol *</label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.isSystem}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Ej. Asistente de Operaciones"
                    className={`w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-purple-900 ${
                      editingRole?.isSystem ? "bg-stone-100 text-stone-500 cursor-not-allowed" : ""
                    }`}
                  />
                  {editingRole?.isSystem && (
                    <p className="text-[10px] text-stone-400 mt-1 italic">
                      Los nombres de los roles del sistema no pueden modificarse.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Descripción</label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Escribe brevemente las responsabilidades del rol..."
                    rows={2}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:outline-none resize-none focus:ring-1 focus:ring-purple-900"
                  />
                </div>

                {/* Modules checklist block */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-2 uppercase tracking-wider">
                    Matriz de Accesos & Permisos
                  </label>
                  <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-150 max-h-[320px] overflow-y-auto bg-stone-50 p-1.5 flex flex-col gap-1.5">
                    {rolePermissions.map((perm) => (
                      <div
                        key={perm.moduleId}
                        className={`p-2.5 rounded-lg border transition ${
                          perm.enabled
                            ? "bg-white border-purple-200 shadow-sm"
                            : "bg-stone-100/50 border-stone-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 select-none">
                            <input
                              type="checkbox"
                              checked={perm.enabled}
                              onChange={() => handleTogglePermission(perm.moduleId)}
                              className="w-3.5 h-3.5 text-purple-900 rounded border-stone-300 focus:ring-purple-500 cursor-pointer"
                            />
                            {perm.moduleLabel}
                          </label>

                          {perm.enabled && (
                            <div className="flex items-center gap-1.5 bg-stone-100 rounded-md p-1 border">
                              <button
                                type="button"
                                onClick={() => handleChangePermissionType(perm.moduleId, "read")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition flex items-center gap-0.5 cursor-pointer ${
                                  perm.accessType === "read"
                                    ? "bg-white text-purple-950 shadow-xs"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                                title="Solo Lectura (Ver datos)"
                              >
                                <Eye className="w-2.5 h-2.5" /> Leer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleChangePermissionType(perm.moduleId, "edit")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition flex items-center gap-0.5 cursor-pointer ${
                                  perm.accessType === "edit"
                                    ? "bg-purple-900 text-stone-100 shadow-xs"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                                title="Permiso de Edición (Modificar y Crear)"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> Editar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-stone-150 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsRoleFormOpen(false)}
                    className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-lg border border-stone-200 transition font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 text-xs bg-purple-900 hover:bg-purple-800 text-stone-100 font-semibold py-2.5 rounded-lg transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
