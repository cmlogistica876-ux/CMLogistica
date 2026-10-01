/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  UserStatus,
  Driver,
  DriverStatus,
  Vehicle,
  VehicleStatus,
  Client,
  Delivery,
  DeliveryStatus,
  Route,
  RouteStatus,
  Incident,
  IncidentStatus,
  IncidentType,
  AuditLog,
  SystemSettings,
  Evidence,
  Coordinates,
  CurrentLocation,
  LocationUpdate,
  EvidenceType,
  CustomRole,
  RoleModulePermission
} from "../types";
import {
  SEED_USERS,
  SEED_DRIVERS,
  SEED_VEHICLES,
  SEED_CLIENTS,
  SEED_DELIVERIES,
  SEED_ROUTES,
  SEED_INCIDENTS,
  SEED_AUDITS,
  DEFAULT_SETTINGS
} from "./mockData";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import {
  isFirebaseConfigured,
  auth as fAuth,
  db as fDb,
  storage as fStorage,
  handleFirestoreError,
  OperationType,
  firebaseConfig
} from "./firebase";

// In local storage keys
const KEY_PREFIX = "rutatrack_";
const KEYS = {
  USERS: KEY_PREFIX + "users",
  DRIVERS: KEY_PREFIX + "drivers",
  VEHICLES: KEY_PREFIX + "vehicles",
  CLIENTS: KEY_PREFIX + "clients",
  DELIVERIES: KEY_PREFIX + "deliveries",
  ROUTES: KEY_PREFIX + "routes",
  INCIDENTS: KEY_PREFIX + "incidents",
  AUDITS: KEY_PREFIX + "audits",
  SETTINGS: KEY_PREFIX + "settings",
  CURRENT_USER: KEY_PREFIX + "current_user",
  LOCATION_UPDATES: KEY_PREFIX + "location_updates",
  ROLES: KEY_PREFIX + "roles"
};

// Firestore collections mapping corresponding to project modules
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  ROLES: "roles",
  DRIVERS: "drivers",
  VEHICLES: "vehicles",
  CLIENTS: "clients",
  DELIVERIES: "deliveries",
  ROUTES: "routes",
  INCIDENTS: "incidents",
  AUDITS: "auditLogs",
  SETTINGS: "settings",
  LOCATIONS: "locationUpdates"
};

// Non-blocking Firestore synchronization helpers
async function firestoreWriteDoc(collectionName: string, docId: string, data: any) {
  if (!fDb) return;
  try {
    // Sanitize object removing undefined fields for Firestore compatibility
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(fDb, collectionName, docId), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

async function firestoreDeleteDoc(collectionName: string, docId: string) {
  if (!fDb) return;
  try {
    await deleteDoc(doc(fDb, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

// Simple subscription listener pattern for reactivity
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeToDb(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const SYSTEM_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "map", label: "Seguimiento de Envíos" },
  { id: "deliveries", label: "Despachos / Órdenes" },
  { id: "routes", label: "Planificador de Rutas" },
  { id: "drivers", label: "Ficha Conductores" },
  { id: "vehicles", label: "Ficha Vehículos" },
  { id: "clients", label: "Clientes" },
  { id: "users", label: "Usuarios & Roles" },
  { id: "reports", label: "Estadísticas & Reportes" },
  { id: "audit", label: "Auditoría Log" },
  { id: "driver-cockpit", label: "Cabina Conductor (Móvil)" }
];

export const DEFAULT_ROLES: CustomRole[] = [
  {
    id: "r-superadmin",
    name: "Super Administrador",
    description: "Acceso total a todas las funciones y configuraciones del sistema.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "edit" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "edit" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "edit" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: true, accessType: "edit" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: true, accessType: "edit" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: true, accessType: "edit" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: true, accessType: "edit" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: true, accessType: "edit" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: true, accessType: "edit" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: true, accessType: "edit" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: true, accessType: "edit" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "r-adminoperativo",
    name: "Administrador Operativo",
    description: "Gestión operativa del día a día, recursos y control de accesos.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "edit" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "edit" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "edit" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: true, accessType: "edit" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: true, accessType: "edit" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: true, accessType: "edit" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: true, accessType: "edit" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: true, accessType: "edit" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: true, accessType: "edit" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: true, accessType: "read" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: true, accessType: "edit" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "r-coordinadorlogistico",
    name: "Coordinador Logístico",
    description: "Planificación de despachos, asignación de rutas y control de transportadores.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "edit" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "edit" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "edit" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: true, accessType: "edit" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: true, accessType: "edit" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: true, accessType: "edit" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: true, accessType: "edit" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: false, accessType: "read" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: true, accessType: "edit" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: false, accessType: "read" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: true, accessType: "edit" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "r-conductor",
    name: "Conductor",
    description: "Visualización de ruta asignada y reporte de entregas y novedades.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "read" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "read" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "read" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: false, accessType: "read" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: false, accessType: "read" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: false, accessType: "read" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: false, accessType: "read" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: false, accessType: "read" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: false, accessType: "read" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: false, accessType: "read" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: true, accessType: "edit" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "r-cliente",
    name: "Cliente / Consulta",
    description: "Seguimiento en tiempo real de sus propios despachos y reportes de estado.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "read" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "read" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "read" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: false, accessType: "read" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: false, accessType: "read" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: false, accessType: "read" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: false, accessType: "read" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: false, accessType: "read" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: true, accessType: "read" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: false, accessType: "read" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: false, accessType: "read" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "r-auditor",
    name: "Auditor / Solo Lectura",
    description: "Acceso global de consulta a todos los módulos sin permisos de modificación.",
    isSystem: true,
    permissions: [
      { moduleId: "dashboard", moduleLabel: "Dashboard", enabled: true, accessType: "read" },
      { moduleId: "map", moduleLabel: "Seguimiento de Envíos", enabled: true, accessType: "read" },
      { moduleId: "deliveries", moduleLabel: "Despachos / Órdenes", enabled: true, accessType: "read" },
      { moduleId: "routes", moduleLabel: "Planificador de Rutas", enabled: true, accessType: "read" },
      { moduleId: "drivers", moduleLabel: "Ficha Conductores", enabled: true, accessType: "read" },
      { moduleId: "vehicles", moduleLabel: "Ficha Vehículos", enabled: true, accessType: "read" },
      { moduleId: "clients", moduleLabel: "Clientes", enabled: true, accessType: "read" },
      { moduleId: "users", moduleLabel: "Usuarios & Roles", enabled: true, accessType: "read" },
      { moduleId: "reports", moduleLabel: "Estadísticas & Reportes", enabled: true, accessType: "read" },
      { moduleId: "audit", moduleLabel: "Auditoría Log", enabled: true, accessType: "read" },
      { moduleId: "driver-cockpit", moduleLabel: "Cabina Conductor (Móvil)", enabled: false, accessType: "read" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Low-level local state loader/saver
class LocalState {
  static get<T>(key: string, defaultVal: T): T {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return defaultVal;
    }
  }

  static set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  }
}

// Business Level DB Service
export class DbService {
  static subscribeToDb(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  // --- SESSION MANAGEMENT ---
  static getCurrentUser(): User | null {
    return LocalState.get<User | null>(KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: User | null) {
    LocalState.set(KEYS.CURRENT_USER, user);
  }

  static async login(usernameOrEmail: string, passwordInput: string): Promise<User> {
    const users = DbService.getUsers();
    
    // Check if the input is for Carlos Martinez
    const isCarlos = 
      usernameOrEmail.toLowerCase() === "carlos.martinez" || 
      usernameOrEmail.toLowerCase() === "cmlogistica876@gmail.com";
      
    if (isCarlos) {
      if (passwordInput !== "Isabella3105") {
        throw new Error("Contraseña incorrecta para el usuario carlos.martinez.");
      }
      const found = users.find((u) => u.email.toLowerCase() === "cmlogistica876@gmail.com") || users[0];
      found.lastLoginAt = new Date().toISOString();
      DbService.updateUserInList(found);
      DbService.setCurrentUser(found);
      
      DbService.createAuditLog(
        found.uid,
        found.email,
        "Inicio de sesión",
        "User",
        found.uid,
        undefined,
        JSON.stringify({ lastLoginAt: found.lastLoginAt })
      );
      return found;
    }

    // Otherwise look for other users by email, explicit username, or dynamic fallback name
    const found = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === usernameOrEmail.toLowerCase();
      const explicitUsernameMatch = u.username && u.username.toLowerCase() === usernameOrEmail.toLowerCase();
      
      // Legacy fallback
      const nameParts = u.displayName.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ");
      const generatedUsername = nameParts.length >= 2 ? `${nameParts[0]}.${nameParts[1]}` : nameParts[0];
      const usernameMatch = generatedUsername === usernameOrEmail.toLowerCase();
      
      return emailMatch || explicitUsernameMatch || usernameMatch;
    });

    if (!found) {
      throw new Error("El usuario o correo electrónico no se encuentra registrado.");
    }
    
    if (found.status === UserStatus.Inactivo) {
      throw new Error("Esta cuenta de usuario ha sido inactivada. Contacte al administrador.");
    }

    // Password validation: Check explicit password if available, otherwise check legacy fallbacks
    if (found.password) {
      if (passwordInput !== found.password) {
        throw new Error("Contraseña incorrecta.");
      }
    } else {
      const nameParts = found.displayName.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ");
      const generatedUsername = nameParts.length >= 2 ? `${nameParts[0]}.${nameParts[1]}` : nameParts[0];

      if (passwordInput !== generatedUsername && passwordInput !== "123456") {
        throw new Error(`Contraseña incorrecta. (Prueba con '${generatedUsername}' o '123456' para esta cuenta de prueba)`);
      }
    }

    // Update last login
    found.lastLoginAt = new Date().toISOString();
    DbService.updateUserInList(found);

    // Save session
    DbService.setCurrentUser(found);

    // Audit log
    DbService.createAuditLog(
      found.uid,
      found.email,
      "Inicio de sesión",
      "User",
      found.uid,
      undefined,
      JSON.stringify({ lastLoginAt: found.lastLoginAt })
    );

    return found;
  }

  static async logout() {
    const currentUser = DbService.getCurrentUser();
    if (currentUser) {
      DbService.createAuditLog(
        currentUser.uid,
        currentUser.email,
        "Cierre de sesión",
        "User",
        currentUser.uid
      );
    }
    DbService.setCurrentUser(null);
  }

  // --- USERS MANAGEMENT ---
  static getUsers(): User[] {
    return LocalState.get<User[]>(KEYS.USERS, SEED_USERS);
  }

  static saveUsers(users: User[]) {
    LocalState.set(KEYS.USERS, users);
    if (fDb) {
      users.forEach((u) => firestoreWriteDoc(FIREBASE_COLLECTIONS.USERS, u.uid, u));
    }
  }

  static createUser(user: Omit<User, "uid" | "createdAt" | "updatedAt">): User {
    const users = DbService.getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (exists) {
      throw new Error("El correo electrónico ya está registrado por otro usuario.");
    }

    const newUser: User = {
      ...user,
      uid: "u-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    DbService.saveUsers(users);

    // Log audit
    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de usuario",
      "User",
      newUser.uid,
      undefined,
      JSON.stringify(newUser)
    );

    return newUser;
  }

  static updateUser(userId: string, data: Partial<Omit<User, "uid" | "createdAt" | "updatedAt">>): User {
    const users = DbService.getUsers();
    const index = users.findIndex((u) => u.uid === userId);
    if (index === -1) throw new Error("Usuario no encontrado.");

    const original = users[index];
    const triggerUser = DbService.getCurrentUser();

    // Security constraints
    if (triggerUser?.uid === userId && data.status && data.status === UserStatus.Inactivo) {
      throw new Error("No puedes inactivar tu propia cuenta de usuario.");
    }
    if (triggerUser?.uid === userId && data.role && data.role !== original.role) {
      throw new Error("No puedes cambiar tu propio rol.");
    }
    if (original.role === UserRole.SuperAdmin && data.role && data.role !== UserRole.SuperAdmin && triggerUser?.role !== UserRole.SuperAdmin) {
      throw new Error("Un administrador operativo no puede degradar el rol de un Super Administrador.");
    }

    const updated: User = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    users[index] = updated;
    DbService.saveUsers(users);

    // If we updated the currently logged in user, refresh session
    if (triggerUser?.uid === userId) {
      DbService.setCurrentUser(updated);
    }

    // Log audit
    DbService.createAuditLog(
      triggerUser?.uid || "system",
      triggerUser?.email || "system",
      "Actualización de usuario",
      "User",
      userId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }
  
  static changePassword(userId: string, newPassword: string): User {
    const users = DbService.getUsers();
    const index = users.findIndex((u) => u.uid === userId);
    if (index === -1) throw new Error("Usuario no encontrado.");

    const original = users[index];
    const updated: User = {
      ...original,
      password: newPassword,
      mustChangePassword: false,
      updatedAt: new Date().toISOString()
    };

    users[index] = updated;
    DbService.saveUsers(users);

    // If we updated the currently logged in user, refresh session
    const current = DbService.getCurrentUser();
    if (current && current.uid === userId) {
      DbService.setCurrentUser(updated);
    }

    // Log audit
    DbService.createAuditLog(
      updated.uid,
      updated.email,
      "Cambio de contraseña (Obligatorio)",
      "User",
      userId,
      undefined,
      "El usuario actualizó su contraseña en su primer ingreso."
    );

    return updated;
  }

  private static updateUserInList(user: User) {
    const users = DbService.getUsers();
    const index = users.findIndex((u) => u.uid === user.uid);
    if (index !== -1) {
      users[index] = user;
      DbService.saveUsers(users);
    }
  }

  // --- ROLES MANAGEMENT ---
  static getRoles(): CustomRole[] {
    return LocalState.get<CustomRole[]>(KEYS.ROLES, DEFAULT_ROLES);
  }

  static saveRoles(roles: CustomRole[]) {
    LocalState.set(KEYS.ROLES, roles);
    if (fDb) {
      roles.forEach((r) => firestoreWriteDoc(FIREBASE_COLLECTIONS.ROLES, r.id, r));
    }
  }

  static createRole(role: Omit<CustomRole, "id" | "createdAt" | "updatedAt">): CustomRole {
    const roles = DbService.getRoles();
    const exists = roles.find((r) => r.name.toLowerCase() === role.name.toLowerCase());
    if (exists) {
      throw new Error("Ya existe un rol con ese nombre.");
    }

    const newRole: CustomRole = {
      ...role,
      id: "role-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    roles.push(newRole);
    DbService.saveRoles(roles);

    // Audit log
    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de rol",
      "Role",
      newRole.id,
      undefined,
      JSON.stringify(newRole)
    );

    return newRole;
  }

  static updateRole(roleId: string, data: Partial<Omit<CustomRole, "id" | "createdAt" | "updatedAt">>): CustomRole {
    const roles = DbService.getRoles();
    const index = roles.findIndex((r) => r.id === roleId);
    if (index === -1) throw new Error("Rol no encontrado.");

    const original = roles[index];
    const triggerUser = DbService.getCurrentUser();

    if (original.isSystem && data.name && data.name !== original.name) {
      throw new Error("No se puede cambiar el nombre de un rol de sistema predefinido.");
    }

    const updated: CustomRole = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    roles[index] = updated;
    DbService.saveRoles(roles);

    // Audit log
    DbService.createAuditLog(
      triggerUser?.uid || "system",
      triggerUser?.email || "system",
      "Actualización de rol",
      "Role",
      roleId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  static deleteRole(roleId: string) {
    const roles = DbService.getRoles();
    const role = roles.find((r) => r.id === roleId);
    if (!role) throw new Error("Rol no encontrado.");
    if (role.isSystem) {
      throw new Error("No se puede eliminar un rol del sistema predefinido.");
    }

    // Check if any user is currently using this role
    const users = DbService.getUsers();
    const isUsed = users.some((u) => u.role === role.name);
    if (isUsed) {
      throw new Error("No se puede eliminar este rol porque está asignado a uno o más usuarios.");
    }

    const filtered = roles.filter((r) => r.id !== roleId);
    DbService.saveRoles(filtered);
    if (fDb) {
      firestoreDeleteDoc(FIREBASE_COLLECTIONS.ROLES, roleId);
    }

    // Audit log
    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Eliminación de rol",
      "Role",
      roleId,
      JSON.stringify(role)
    );
  }

  // --- DRIVERS MANAGEMENT ---
  static getDrivers(): Driver[] {
    return LocalState.get<Driver[]>(KEYS.DRIVERS, SEED_DRIVERS);
  }

  static saveDrivers(drivers: Driver[]) {
    LocalState.set(KEYS.DRIVERS, drivers);
    if (fDb) {
      drivers.forEach((d) => firestoreWriteDoc(FIREBASE_COLLECTIONS.DRIVERS, d.id, d));
    }
  }

  static createDriver(driver: Omit<Driver, "id" | "createdAt" | "updatedAt">): Driver {
    const drivers = DbService.getDrivers();
    const existsDoc = drivers.find((d) => d.document === driver.document);
    if (existsDoc) throw new Error("Ya existe un conductor registrado con este documento.");

    const newDriver: Driver = {
      ...driver,
      id: "drv-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    drivers.push(newDriver);
    DbService.saveDrivers(drivers);

    // Update assigned vehicle if specified
    if (driver.assignedVehicleId) {
      DbService.assignVehicleToDriver(newDriver.id, driver.assignedVehicleId);
    }

    // Auto-create or associate user if requested
    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de conductor",
      "Driver",
      newDriver.id,
      undefined,
      JSON.stringify(newDriver)
    );

    return newDriver;
  }

  static updateDriver(driverId: string, data: Partial<Omit<Driver, "id" | "createdAt" | "updatedAt">>): Driver {
    const drivers = DbService.getDrivers();
    const index = drivers.findIndex((d) => d.id === driverId);
    if (index === -1) throw new Error("Conductor no encontrado.");

    const original = drivers[index];
    const updated: Driver = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    drivers[index] = updated;
    DbService.saveDrivers(drivers);

    // Handle vehicle reassignments
    if (data.assignedVehicleId !== undefined && data.assignedVehicleId !== original.assignedVehicleId) {
      DbService.assignVehicleToDriver(driverId, data.assignedVehicleId);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de conductor",
      "Driver",
      driverId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  private static assignVehicleToDriver(driverId: string, vehicleId: string | undefined) {
    const vehicles = DbService.getVehicles();
    
    // Unassign driver from any vehicle first
    vehicles.forEach((v) => {
      if (v.assignedDriverId === driverId) {
        v.assignedDriverId = undefined;
        v.updatedAt = new Date().toISOString();
      }
    });

    // If new vehicle is assigned, update it
    if (vehicleId) {
      const vIndex = vehicles.findIndex((v) => v.id === vehicleId);
      if (vIndex !== -1) {
        // Unassign previous driver from that vehicle if any
        const prevDriverId = vehicles[vIndex].assignedDriverId;
        if (prevDriverId && prevDriverId !== driverId) {
          const drivers = DbService.getDrivers();
          const dIndex = drivers.findIndex((d) => d.id === prevDriverId);
          if (dIndex !== -1) {
            drivers[dIndex].assignedVehicleId = undefined;
            drivers[dIndex].updatedAt = new Date().toISOString();
            DbService.saveDrivers(drivers);
          }
        }
        vehicles[vIndex].assignedDriverId = driverId;
        vehicles[vIndex].updatedAt = new Date().toISOString();
      }
    }

    DbService.saveVehicles(vehicles);
  }

  // --- VEHICLES MANAGEMENT ---
  static getVehicles(): Vehicle[] {
    return LocalState.get<Vehicle[]>(KEYS.VEHICLES, SEED_VEHICLES);
  }

  static saveVehicles(vehicles: Vehicle[]) {
    LocalState.set(KEYS.VEHICLES, vehicles);
    if (fDb) {
      vehicles.forEach((v) => firestoreWriteDoc(FIREBASE_COLLECTIONS.VEHICLES, v.id, v));
    }
  }

  static createVehicle(vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">): Vehicle {
    const vehicles = DbService.getVehicles();
    const exists = vehicles.find((v) => v.plate.toUpperCase() === vehicle.plate.toUpperCase());
    if (exists) throw new Error(`Ya existe un vehículo registrado con la placa ${vehicle.plate.toUpperCase()}.`);

    const newVehicle: Vehicle = {
      ...vehicle,
      id: "veh-" + Math.random().toString(36).substr(2, 9),
      plate: vehicle.plate.toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vehicles.push(newVehicle);
    DbService.saveVehicles(vehicles);

    // Sync driver back-reference
    if (vehicle.assignedDriverId) {
      const drivers = DbService.getDrivers();
      const dIndex = drivers.findIndex((d) => d.id === vehicle.assignedDriverId);
      if (dIndex !== -1) {
        drivers[dIndex].assignedVehicleId = newVehicle.id;
        drivers[dIndex].updatedAt = new Date().toISOString();
        DbService.saveDrivers(drivers);
      }
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de vehículo",
      "Vehicle",
      newVehicle.id,
      undefined,
      JSON.stringify(newVehicle)
    );

    return newVehicle;
  }

  static updateVehicle(vehicleId: string, data: Partial<Omit<Vehicle, "id" | "createdAt" | "updatedAt">>): Vehicle {
    const vehicles = DbService.getVehicles();
    const index = vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) throw new Error("Vehículo no encontrado.");

    const original = vehicles[index];
    const updated: Vehicle = {
      ...original,
      ...data,
      plate: data.plate ? data.plate.toUpperCase() : original.plate,
      updatedAt: new Date().toISOString()
    };

    vehicles[index] = updated;
    DbService.saveVehicles(vehicles);

    // Handle driver reassignment back-reference
    if (data.assignedDriverId !== undefined && data.assignedDriverId !== original.assignedDriverId) {
      const drivers = DbService.getDrivers();
      // Clear old driver reference
      drivers.forEach((d) => {
        if (d.assignedVehicleId === vehicleId) {
          d.assignedVehicleId = undefined;
          d.updatedAt = new Date().toISOString();
        }
      });
      // Set new driver reference
      if (data.assignedDriverId) {
        const dIndex = drivers.findIndex((d) => d.id === data.assignedDriverId);
        if (dIndex !== -1) {
          drivers[dIndex].assignedVehicleId = vehicleId;
          drivers[dIndex].updatedAt = new Date().toISOString();
        }
      }
      DbService.saveDrivers(drivers);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de vehículo",
      "Vehicle",
      vehicleId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  // --- CLIENTS MANAGEMENT ---
  static getClients(): Client[] {
    return LocalState.get<Client[]>(KEYS.CLIENTS, SEED_CLIENTS);
  }

  static saveClients(clients: Client[]) {
    LocalState.set(KEYS.CLIENTS, clients);
    if (fDb) {
      clients.forEach((c) => firestoreWriteDoc(FIREBASE_COLLECTIONS.CLIENTS, c.id, c));
    }
  }

  static createClient(client: Omit<Client, "id" | "createdAt" | "updatedAt">): Client {
    const clients = DbService.getClients();
    const exists = clients.find((c) => c.taxId === client.taxId);
    if (exists) throw new Error("Ya existe un cliente con este NIT / documento.");

    const newClient: Client = {
      ...client,
      id: "cli-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    clients.push(newClient);
    DbService.saveClients(clients);

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de cliente",
      "Client",
      newClient.id,
      undefined,
      JSON.stringify(newClient)
    );

    return newClient;
  }

  static updateClient(clientId: string, data: Partial<Omit<Client, "id" | "createdAt" | "updatedAt">>): Client {
    const clients = DbService.getClients();
    const index = clients.findIndex((c) => c.id === clientId);
    if (index === -1) throw new Error("Cliente no encontrado.");

    const original = clients[index];
    const updated: Client = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    clients[index] = updated;
    DbService.saveClients(clients);

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de cliente",
      "Client",
      clientId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  // --- DELIVERIES MANAGEMENT ---
  static getDeliveries(): Delivery[] {
    return LocalState.get<Delivery[]>(KEYS.DELIVERIES, SEED_DELIVERIES);
  }

  static saveDeliveries(deliveries: Delivery[]) {
    LocalState.set(KEYS.DELIVERIES, deliveries);
    if (fDb) {
      deliveries.forEach((d) => firestoreWriteDoc(FIREBASE_COLLECTIONS.DELIVERIES, d.id, d));
    }
  }

  static createDelivery(delivery: Omit<Delivery, "id" | "code" | "evidenceIds" | "createdAt" | "updatedAt">): Delivery {
    const deliveries = DbService.getDeliveries();
    
    // Generate unique code ENT-XXX
    const codeNum = Math.floor(100000 + Math.random() * 900000);
    const newDelivery: Delivery = {
      ...delivery,
      id: "del-" + Math.random().toString(36).substr(2, 9),
      code: `ENT-${codeNum}`,
      evidenceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    deliveries.push(newDelivery);
    DbService.saveDeliveries(deliveries);

    // If routeId is provided, append this delivery to that route
    if (delivery.routeId) {
      DbService.addDeliveryToRoute(delivery.routeId, newDelivery.id);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de entrega",
      "Delivery",
      newDelivery.id,
      undefined,
      JSON.stringify(newDelivery)
    );

    return newDelivery;
  }

  static updateDelivery(deliveryId: string, data: Partial<Omit<Delivery, "id" | "createdAt" | "updatedAt">>): Delivery {
    const deliveries = DbService.getDeliveries();
    const index = deliveries.findIndex((d) => d.id === deliveryId);
    if (index === -1) throw new Error("Entrega no encontrada.");

    const original = deliveries[index];

    // Validate state transitions if status is changing
    if (data.status && data.status !== original.status) {
      DbService.validateDeliveryStatusTransition(original.status, data.status);
    }

    const updated: Delivery = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    deliveries[index] = updated;
    DbService.saveDeliveries(deliveries);

    // Handle route assignment changes
    if (data.routeId !== undefined && data.routeId !== original.routeId) {
      if (original.routeId) {
        DbService.removeDeliveryFromRoute(original.routeId, deliveryId);
      }
      if (data.routeId) {
        DbService.addDeliveryToRoute(data.routeId, deliveryId);
      }
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de entrega",
      "Delivery",
      deliveryId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  // State Transition Validation for Deliveries
  private static validateDeliveryStatusTransition(from: DeliveryStatus, to: DeliveryStatus) {
    if (from === to) return;

    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.Pendiente]: [DeliveryStatus.Asignada, DeliveryStatus.Cancelada],
      [DeliveryStatus.Asignada]: [DeliveryStatus.EnCamino, DeliveryStatus.Cancelada, DeliveryStatus.Pendiente],
      [DeliveryStatus.EnCamino]: [DeliveryStatus.EnSitio, DeliveryStatus.Fallida, DeliveryStatus.Reprogramada],
      [DeliveryStatus.EnSitio]: [DeliveryStatus.Entregada, DeliveryStatus.Fallida],
      [DeliveryStatus.Fallida]: [DeliveryStatus.Reprogramada],
      [DeliveryStatus.Entregada]: [], // End state
      [DeliveryStatus.Reprogramada]: [DeliveryStatus.Pendiente, DeliveryStatus.Asignada],
      [DeliveryStatus.Cancelada]: []  // End state
    };

    const allowed = validTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(
        `Transición de estado de entrega inválida: No se puede cambiar de '${from}' a '${to}'.`
      );
    }
  }

  // --- ROUTES MANAGEMENT ---
  static getRoutes(): Route[] {
    return LocalState.get<Route[]>(KEYS.ROUTES, SEED_ROUTES);
  }

  static saveRoutes(routes: Route[]) {
    LocalState.set(KEYS.ROUTES, routes);
    if (fDb) {
      routes.forEach((r) => firestoreWriteDoc(FIREBASE_COLLECTIONS.ROUTES, r.id, r));
    }
  }

  static createRoute(route: Omit<Route, "id" | "code" | "createdAt" | "updatedAt">): Route {
    const routes = DbService.getRoutes();
    const codeNum = Math.floor(100 + Math.random() * 900);
    const dateStr = new Date().toISOString().slice(2,10).replace(/-/g, "");
    
    const newRoute: Route = {
      ...route,
      id: "rt-" + Math.random().toString(36).substr(2, 9),
      code: `RUT-GEN-${dateStr}-${codeNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    routes.push(newRoute);
    DbService.saveRoutes(routes);

    // Sync vehicle and driver status if route is started/assigned
    if (route.driverId && route.vehicleId && route.status === RouteStatus.EnCurso) {
      DbService.updateDriverStatus(route.driverId, DriverStatus.EnRuta);
      DbService.updateVehicleStatus(route.vehicleId, VehicleStatus.EnRuta);
    }

    // Attach routeId to all contained deliveryIds
    if (route.deliveryIds && route.deliveryIds.length > 0) {
      const deliveries = DbService.getDeliveries();
      route.deliveryIds.forEach((delId) => {
        const dIdx = deliveries.findIndex((d) => d.id === delId);
        if (dIdx !== -1) {
          deliveries[dIdx].routeId = newRoute.id;
          deliveries[dIdx].status = DeliveryStatus.Asignada;
          deliveries[dIdx].updatedAt = new Date().toISOString();
        }
      });
      DbService.saveDeliveries(deliveries);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Creación de ruta",
      "Route",
      newRoute.id,
      undefined,
      JSON.stringify(newRoute)
    );

    return newRoute;
  }

  static updateRoute(routeId: string, data: Partial<Omit<Route, "id" | "createdAt" | "updatedAt">>): Route {
    const routes = DbService.getRoutes();
    const index = routes.findIndex((r) => r.id === routeId);
    if (index === -1) throw new Error("Ruta no encontrada.");

    const original = routes[index];

    // Validate route state transitions
    if (data.status && data.status !== original.status) {
      DbService.validateRouteStatusTransition(original.status, data.status);
    }

    const updated: Route = {
      ...original,
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Auto-timings depending on state transitions
    if (data.status === RouteStatus.EnCurso && original.status !== RouteStatus.EnCurso) {
      updated.actualStartAt = new Date().toISOString();
      // Propagate status 'En camino' to assigned deliveries
      if (updated.deliveryIds.length > 0) {
        const deliveries = DbService.getDeliveries();
        updated.deliveryIds.forEach((delId) => {
          const dIdx = deliveries.findIndex((d) => d.id === delId);
          if (dIdx !== -1 && deliveries[dIdx].status === DeliveryStatus.Asignada) {
            deliveries[dIdx].status = DeliveryStatus.EnCamino;
            deliveries[dIdx].updatedAt = new Date().toISOString();
          }
        });
        DbService.saveDeliveries(deliveries);
      }
      // Update Driver & Vehicle status
      if (updated.driverId) DbService.updateDriverStatus(updated.driverId, DriverStatus.EnRuta);
      if (updated.vehicleId) DbService.updateVehicleStatus(updated.vehicleId, VehicleStatus.EnRuta);
    } else if (data.status === RouteStatus.Finalizada && original.status !== RouteStatus.Finalizada) {
      updated.actualEndAt = new Date().toISOString();
      // Free vehicle and driver status
      if (updated.driverId) DbService.updateDriverStatus(updated.driverId, DriverStatus.Disponible);
      if (updated.vehicleId) DbService.updateVehicleStatus(updated.vehicleId, VehicleStatus.Disponible);
    } else if (data.status === RouteStatus.Cancelada && original.status !== RouteStatus.Cancelada) {
      // Free vehicle and driver
      if (updated.driverId) DbService.updateDriverStatus(updated.driverId, DriverStatus.Disponible);
      if (updated.vehicleId) DbService.updateVehicleStatus(updated.vehicleId, VehicleStatus.Disponible);
      // Put deliveries back to pendiente or cancel them
      if (updated.deliveryIds.length > 0) {
        const deliveries = DbService.getDeliveries();
        updated.deliveryIds.forEach((delId) => {
          const dIdx = deliveries.findIndex((d) => d.id === delId);
          if (dIdx !== -1) {
            deliveries[dIdx].routeId = undefined;
            deliveries[dIdx].status = DeliveryStatus.Pendiente;
            deliveries[dIdx].updatedAt = new Date().toISOString();
          }
        });
        DbService.saveDeliveries(deliveries);
      }
    }

    routes[index] = updated;
    DbService.saveRoutes(routes);

    // Sync delivery routes if deliveryIds is updated
    if (data.deliveryIds !== undefined) {
      const deliveries = DbService.getDeliveries();
      // Clear routeId from deliveries no longer in route
      deliveries.forEach((d) => {
        if (d.routeId === routeId && !data.deliveryIds?.includes(d.id)) {
          d.routeId = undefined;
          d.status = DeliveryStatus.Pendiente;
          d.updatedAt = new Date().toISOString();
        }
      });
      // Add routeId to all new ones
      data.deliveryIds.forEach((delId) => {
        const dIdx = deliveries.findIndex((d) => d.id === delId);
        if (dIdx !== -1) {
          deliveries[dIdx].routeId = routeId;
          deliveries[dIdx].status = DeliveryStatus.Asignada;
          deliveries[dIdx].updatedAt = new Date().toISOString();
        }
      });
      DbService.saveDeliveries(deliveries);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de ruta",
      "Route",
      routeId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  private static validateRouteStatusTransition(from: RouteStatus, to: RouteStatus) {
    if (from === to) return;

    const validTransitions: Record<RouteStatus, RouteStatus[]> = {
      [RouteStatus.Planificada]: [RouteStatus.Asignada, RouteStatus.Cancelada],
      [RouteStatus.Asignada]: [RouteStatus.EnCurso, RouteStatus.Cancelada, RouteStatus.Planificada],
      [RouteStatus.EnCurso]: [RouteStatus.Finalizada, RouteStatus.Cancelada],
      [RouteStatus.Finalizada]: [],
      [RouteStatus.Cancelada]: []
    };

    const allowed = validTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Transición de estado de ruta inválida: No se puede cambiar de '${from}' a '${to}'.`);
    }
  }

  private static addDeliveryToRoute(routeId: string, deliveryId: string) {
    const routes = DbService.getRoutes();
    const index = routes.findIndex((r) => r.id === routeId);
    if (index !== -1) {
      const r = routes[index];
      if (!r.deliveryIds.includes(deliveryId)) {
        r.deliveryIds.push(deliveryId);
        r.updatedAt = new Date().toISOString();
        DbService.saveRoutes(routes);
      }
    }
  }

  private static removeDeliveryFromRoute(routeId: string, deliveryId: string) {
    const routes = DbService.getRoutes();
    const index = routes.findIndex((r) => r.id === routeId);
    if (index !== -1) {
      const r = routes[index];
      r.deliveryIds = r.deliveryIds.filter((id) => id !== deliveryId);
      r.updatedAt = new Date().toISOString();
      DbService.saveRoutes(routes);
    }
  }

  // --- INCIDENTS MANAGEMENT (NOVEDADES) ---
  static getIncidents(): Incident[] {
    return LocalState.get<Incident[]>(KEYS.INCIDENTS, SEED_INCIDENTS);
  }

  static saveIncidents(incidents: Incident[]) {
    LocalState.set(KEYS.INCIDENTS, incidents);
    if (fDb) {
      incidents.forEach((inc) => firestoreWriteDoc(FIREBASE_COLLECTIONS.INCIDENTS, inc.id, inc));
    }
  }

  static createIncident(incident: Omit<Incident, "id" | "status" | "createdAt" | "updatedAt">): Incident {
    const incidents = DbService.getIncidents();
    const newIncident: Incident = {
      ...incident,
      id: "inc-" + Math.random().toString(36).substr(2, 9),
      status: IncidentStatus.Abierto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    incidents.push(newIncident);
    DbService.saveIncidents(incidents);

    // If it's attached to a delivery, let's also update the delivery status to Fallida if relevant
    if (incident.deliveryId && [IncidentType.ClienteAusente, IncidentType.DireccionIncorrecta, IncidentType.RechazoEntrega].includes(incident.type)) {
      try {
        DbService.updateDelivery(incident.deliveryId, {
          status: DeliveryStatus.Fallida,
          failureReason: incident.type
        });
      } catch (e) {
        console.warn("Could not auto-fail delivery from incident:", e);
      }
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Registro de novedad",
      "Incident",
      newIncident.id,
      undefined,
      JSON.stringify(newIncident)
    );

    return newIncident;
  }

  static solveIncident(incidentId: string): Incident {
    const incidents = DbService.getIncidents();
    const index = incidents.findIndex((i) => i.id === incidentId);
    if (index === -1) throw new Error("Incidente no encontrado.");

    const original = incidents[index];
    const updated: Incident = {
      ...original,
      status: IncidentStatus.Solucionado,
      updatedAt: new Date().toISOString()
    };

    incidents[index] = updated;
    DbService.saveIncidents(incidents);

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Incidente solucionado",
      "Incident",
      incidentId,
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  // --- LOCATION TRACKING & SIMULATOR ---
  static getLocationUpdates(): LocationUpdate[] {
    return LocalState.get<LocationUpdate[]>(KEYS.LOCATION_UPDATES, []);
  }

  static saveLocationUpdates(updates: LocationUpdate[]) {
    // Keep only last 500 locations to prevent local storage quota bloat
    const capped = updates.slice(-500);
    LocalState.set(KEYS.LOCATION_UPDATES, capped);
    if (fDb && updates.length > 0) {
      const latest = updates[updates.length - 1];
      firestoreWriteDoc(FIREBASE_COLLECTIONS.LOCATIONS, latest.id, latest);
    }
  }

  static updateVehicleLocation(
    vehicleId: string,
    driverId: string,
    routeId: string,
    coords: Coordinates,
    opts?: { heading?: number; speed?: number; accuracy?: number }
  ): Vehicle {
    // Update vehicle's currentLocation field
    const vehicles = DbService.getVehicles();
    const index = vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) throw new Error("Vehículo no encontrado.");

    const original = vehicles[index];
    const loc: CurrentLocation = {
      ...coords,
      heading: opts?.heading ?? (original.currentLocation?.heading || 0) + (Math.random() * 20 - 10),
      speed: opts?.speed ?? (Math.random() > 0.2 ? 30 + Math.floor(Math.random() * 25) : 0),
      accuracy: opts?.accuracy ?? 5,
      updatedAt: new Date().toISOString()
    };

    const updated: Vehicle = {
      ...original,
      currentLocation: loc,
      updatedAt: new Date().toISOString()
    };

    vehicles[index] = updated;
    DbService.saveVehicles(vehicles);

    // Save historical log update
    const updates = DbService.getLocationUpdates();
    const newUpdate: LocationUpdate = {
      id: "upd-" + Math.random().toString(36).substr(2, 9),
      vehicleId,
      driverId,
      routeId,
      ...loc,
      timestamp: loc.updatedAt
    };
    updates.push(newUpdate);
    DbService.saveLocationUpdates(updates);

    return updated;
  }

  // Simulate vehicle movements across Colombia to show dynamic dashboard tracking!
  static runTrackingSimulation() {
    const activeVehicles = DbService.getVehicles().filter(
      (v) => v.status === VehicleStatus.EnRuta && v.assignedDriverId
    );

    if (activeVehicles.length === 0) return;

    // Move each vehicle by a tiny delta
    activeVehicles.forEach((v) => {
      if (!v.currentLocation) return;
      const routes = DbService.getRoutes().filter(
        (r) => r.vehicleId === v.id && r.status === RouteStatus.EnCurso
      );
      const routeId = routes[0]?.id || "rt-sim";

      // Slight random drift
      const deltaLat = (Math.random() - 0.5) * 0.0015;
      const deltaLng = (Math.random() - 0.5) * 0.0015;

      DbService.updateVehicleLocation(
        v.id,
        v.assignedDriverId!,
        routeId,
        {
          lat: v.currentLocation.lat + deltaLat,
          lng: v.currentLocation.lng + deltaLng
        },
        {
          heading: Math.floor(Math.random() * 360),
          speed: Math.floor(20 + Math.random() * 40),
          accuracy: 5
        }
      );
    });
  }

  // --- EVIDENCES & FILES ---
  static async uploadEvidence(
    deliveryId: string,
    type: EvidenceType,
    fileBase64OrUrl: string,
    opts?: { lat?: number; lng?: number; accuracy?: number }
  ): Promise<Evidence> {
    const trigger = DbService.getCurrentUser();
    const newEv: Evidence = {
      id: "ev-" + Math.random().toString(36).substr(2, 9),
      deliveryId,
      type,
      fileUrl: fileBase64OrUrl,
      uploadedBy: trigger?.displayName || "Conductor de ruta",
      metadata: opts ? {
        lat: opts.lat,
        lng: opts.lng,
        accuracy: opts.accuracy,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "Navegador PWA"
      } : undefined,
      createdAt: new Date().toISOString()
    };

    // Save evidence reference in deliveries
    const deliveries = DbService.getDeliveries();
    const dIdx = deliveries.findIndex((d) => d.id === deliveryId);
    if (dIdx !== -1) {
      deliveries[dIdx].evidenceIds.push(newEv.id);
      deliveries[dIdx].updatedAt = new Date().toISOString();
      DbService.saveDeliveries(deliveries);
    }

    // Save evidence in our mock global evidence store or return it
    // Audit logging
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      `Carga de evidencia (${type})`,
      "Evidence",
      newEv.id,
      undefined,
      JSON.stringify(newEv)
    );

    return newEv;
  }

  // --- AUDIT SYSTEM ---
  static getAuditLogs(): AuditLog[] {
    return LocalState.get<AuditLog[]>(KEYS.AUDITS, SEED_AUDITS);
  }

  static createAuditLog(
    userId: string,
    userEmail: string,
    action: string,
    entityType: string,
    entityId: string,
    before?: string,
    after?: string
  ): AuditLog {
    const logs = DbService.getAuditLogs();
    const newLog: AuditLog = {
      id: "aud-" + Math.random().toString(36).substr(2, 9),
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      before,
      after,
      createdAt: new Date().toISOString()
    };

    logs.push(newLog);
    // Cap audits at last 1000 records
    const capped = logs.slice(-1000);
    LocalState.set(KEYS.AUDITS, capped);
    if (fDb) {
      firestoreWriteDoc(FIREBASE_COLLECTIONS.AUDITS, newLog.id, newLog);
    }

    return newLog;
  }

  // --- SETTINGS MANAGEMENT ---
  static getSettings(): SystemSettings {
    return LocalState.get<SystemSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    const original = DbService.getSettings();
    const updated: SystemSettings = {
      ...original,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    LocalState.set(KEYS.SETTINGS, updated);
    if (fDb) {
      firestoreWriteDoc(FIREBASE_COLLECTIONS.SETTINGS, "general", updated);
    }

    const trigger = DbService.getCurrentUser();
    DbService.createAuditLog(
      trigger?.uid || "system",
      trigger?.email || "system",
      "Actualización de parámetros generales",
      "Settings",
      "system",
      JSON.stringify(original),
      JSON.stringify(updated)
    );

    return updated;
  }

  // --- PRIVATE UTILITIES FOR BACK-REFERENCES ---
  private static updateDriverStatus(driverId: string, status: DriverStatus) {
    const drivers = DbService.getDrivers();
    const idx = drivers.findIndex((d) => d.id === driverId);
    if (idx !== -1) {
      drivers[idx].status = status;
      drivers[idx].updatedAt = new Date().toISOString();
      DbService.saveDrivers(drivers);
    }
  }

  private static updateVehicleStatus(vehicleId: string, status: VehicleStatus) {
    const vehicles = DbService.getVehicles();
    const idx = vehicles.findIndex((v) => v.id === vehicleId);
    if (idx !== -1) {
      vehicles[idx].status = status;
      vehicles[idx].updatedAt = new Date().toISOString();
      DbService.saveVehicles(vehicles);
    }
  }

  // --- SIMULATION & RESET METHODS ---
  static simulateRoleChange(role: UserRole) {
    const user = DbService.getCurrentUser();
    if (user) {
      const original = { ...user };
      user.role = role;
      if (role === UserRole.Conductor) {
        user.driverId = "drv-1";
      } else if (role === UserRole.Cliente) {
        user.clientId = "cli-1";
      } else {
        user.driverId = undefined;
        user.clientId = undefined;
      }
      user.updatedAt = new Date().toISOString();
      DbService.setCurrentUser(user);

      const users = DbService.getUsers();
      const idx = users.findIndex((u) => u.uid === user.uid);
      if (idx !== -1) {
        users[idx] = user;
        DbService.saveUsers(users);
      }

      DbService.createAuditLog(
        user.uid,
        user.email,
        `Cambio de rol simulado a ${role}`,
        "User",
        user.uid,
        JSON.stringify(original),
        JSON.stringify(user)
      );
    }
  }

  static resetDatabaseToSeed() {
    const current = DbService.getCurrentUser();
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.DRIVERS);
    localStorage.removeItem(KEYS.VEHICLES);
    localStorage.removeItem(KEYS.CLIENTS);
    localStorage.removeItem(KEYS.DELIVERIES);
    localStorage.removeItem(KEYS.ROUTES);
    localStorage.removeItem(KEYS.AUDITS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.LOCATION_UPDATES);
    localStorage.removeItem(KEYS.ROLES);

    // Keep the logged in user session if there was one, otherwise keep it null
    DbService.setCurrentUser(current);

    notifyListeners();
  }

  // --- FIREBASE FIRESTORE SYNC & POPULATION ---
  static async syncAllTablesToFirebase(): Promise<{
    success: boolean;
    message: string;
    details: Record<string, number>;
  }> {
    if (!fDb) {
      throw new Error("Firebase no está inicializado. Revisa las credenciales de conexión.");
    }

    const details: Record<string, number> = {};

    // 1. Users table
    const users = DbService.getUsers();
    for (const u of users) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.USERS, u.uid, u);
    }
    details["users"] = users.length;

    // 2. Roles table
    const roles = DbService.getRoles();
    for (const r of roles) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.ROLES, r.id, r);
    }
    details["roles"] = roles.length;

    // 3. Drivers table
    const drivers = DbService.getDrivers();
    for (const d of drivers) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.DRIVERS, d.id, d);
    }
    details["drivers"] = drivers.length;

    // 4. Vehicles table
    const vehicles = DbService.getVehicles();
    for (const v of vehicles) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.VEHICLES, v.id, v);
    }
    details["vehicles"] = vehicles.length;

    // 5. Clients table
    const clients = DbService.getClients();
    for (const c of clients) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.CLIENTS, c.id, c);
    }
    details["clients"] = clients.length;

    // 6. Deliveries table
    const deliveries = DbService.getDeliveries();
    for (const del of deliveries) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.DELIVERIES, del.id, del);
    }
    details["deliveries"] = deliveries.length;

    // 7. Routes table
    const routes = DbService.getRoutes();
    for (const r of routes) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.ROUTES, r.id, r);
    }
    details["routes"] = routes.length;

    // 8. Incidents table
    const incidents = DbService.getIncidents();
    for (const inc of incidents) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.INCIDENTS, inc.id, inc);
    }
    details["incidents"] = incidents.length;

    // 9. Audits table
    const audits = DbService.getAuditLogs();
    for (const a of audits) {
      await firestoreWriteDoc(FIREBASE_COLLECTIONS.AUDITS, a.id, a);
    }
    details["auditLogs"] = audits.length;

    // 10. Settings table
    const settings = DbService.getSettings();
    await firestoreWriteDoc(FIREBASE_COLLECTIONS.SETTINGS, "general", settings);
    details["settings"] = 1;

    console.log("🔥 RutaTrack: Todas las tablas creadas y sincronizadas en Firebase:", details);
    notifyListeners();
    return {
      success: true,
      message: "¡Todas las tablas y registros han sido creados y sincronizados exitosamente en Firebase Firestore!",
      details
    };
  }

  static async initFirebaseSync() {
    if (!fDb) return;
    try {
      const usersSnap = await getDocs(collection(fDb, FIREBASE_COLLECTIONS.USERS));
      if (usersSnap.empty) {
        console.log("🔥 RutaTrack: Firestore detectado sin registros previos. Sembrando tablas iniciales...");
        await DbService.syncAllTablesToFirebase();
      } else {
        console.log("🔥 RutaTrack: Conectado a Firestore. Se encontraron tablas existentes en el proyecto.");
      }
    } catch (err) {
      console.warn("⚠️ Aviso al conectar con Firestore (puede requerir verificación de reglas de seguridad o creación de base de datos):", err);
    }
  }

  static getFirebaseProjectInfo() {
    return {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      isConfigured: isFirebaseConfigured,
      collections: [
        { id: "users", name: "Usuarios & Accesos", count: DbService.getUsers().length },
        { id: "roles", name: "Roles & Permisos", count: DbService.getRoles().length },
        { id: "drivers", name: "Ficha Conductores", count: DbService.getDrivers().length },
        { id: "vehicles", name: "Ficha Vehículos", count: DbService.getVehicles().length },
        { id: "clients", name: "Clientes & Destinos", count: DbService.getClients().length },
        { id: "deliveries", name: "Despachos / Órdenes", count: DbService.getDeliveries().length },
        { id: "routes", name: "Planificador de Rutas", count: DbService.getRoutes().length },
        { id: "incidents", name: "Novedades en Ruta", count: DbService.getIncidents().length },
        { id: "auditLogs", name: "Auditoría & Trazabilidad", count: DbService.getAuditLogs().length },
        { id: "settings", name: "Configuración General", count: 1 }
      ]
    };
  }
}
