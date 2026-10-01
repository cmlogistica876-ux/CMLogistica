/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SuperAdmin = "Super Administrador",
  AdminOperativo = "Administrador Operativo",
  CoordinadorLogistico = "Coordinador Logístico",
  Conductor = "Conductor",
  Cliente = "Cliente / Consulta",
  Auditor = "Auditor / Solo Lectura"
}

export enum UserStatus {
  Activo = "Activo",
  Inactivo = "Inactivo"
}

export enum DriverStatus {
  Disponible = "Disponible",
  EnRuta = "En Ruta",
  Inactivo = "Inactivo",
  Suspendido = "Suspendido"
}

export enum VehicleStatus {
  Disponible = "Disponible",
  EnRuta = "En Ruta",
  Mantenimiento = "Mantenimiento",
  Inactivo = "Inactivo"
}

export enum DeliveryStatus {
  Pendiente = "Pendiente",
  Asignada = "Asignada",
  EnCamino = "En camino",
  EnSitio = "En sitio",
  Entregada = "Entregada",
  Fallida = "Fallida",
  Reprogramada = "Reprogramada",
  Cancelada = "Cancelada"
}

export enum RouteStatus {
  Planificada = "Planificada",
  Asignada = "Asignada",
  EnCurso = "En curso",
  Finalizada = "Finalizada",
  Cancelada = "Cancelada"
}

export enum IncidentType {
  ClienteAusente = "Cliente ausente",
  DireccionIncorrecta = "Dirección incorrecta",
  RechazoEntrega = "Rechazo de entrega",
  VehiculoVarado = "Vehículo varado",
  Accidente = "Accidente",
  Trafico = "Tráfico pesado",
  Otro = "Otro"
}

export enum IncidentStatus {
  Abierto = "Abierto",
  Solucionado = "Solucionado"
}

export enum EvidenceType {
  Foto = "Foto",
  Firma = "Firma",
  Documento = "Documento"
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: string; // Dynamic role string supporting CustomRole names
  status: UserStatus;
  clientId?: string; // If role is Cliente
  driverId?: string; // If role is Conductor
  username?: string; // Explicit login username
  password?: string; // Explicit login password
  mustChangePassword?: boolean; // Forced password change flag
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Driver {
  id: string;
  userId?: string; // Tied to a user authentication record
  name: string;
  document: string;
  phone: string;
  email: string;
  licenseNumber: string;
  status: DriverStatus;
  assignedVehicleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CurrentLocation extends Coordinates {
  heading?: number;
  speed?: number; // In km/h
  accuracy?: number; // In meters
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plate: string; // Placa (e.g. ABC-123)
  type: string; // e.g. Turbo, Camioneta, Van, Moto
  brand: string;
  model: string;
  capacity: number; // In kg or volume
  status: VehicleStatus;
  assignedDriverId?: string;
  currentLocation?: CurrentLocation;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  taxId: string; // NIT o Documento
  address: string;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  deliveryId: string;
  type: EvidenceType;
  fileUrl: string; // base64 / storage URL
  storagePath?: string;
  uploadedBy: string; // Name or UID
  metadata?: {
    lat?: number;
    lng?: number;
    accuracy?: number;
    deviceInfo?: string;
  };
  createdAt: string;
}

export interface Delivery {
  id: string;
  code: string; // delivery code
  clientId: string;
  routeId?: string;
  address: string;
  city: string;
  location: Coordinates;
  scheduledDate: string; // YYYY-MM-DD
  timeWindowStart: string; // HH:MM
  timeWindowEnd: string; // HH:MM
  status: DeliveryStatus;
  priority: "Baja" | "Media" | "Alta";
  notes?: string;
  evidenceIds: string[]; // references Evidences
  failureReason?: string;
  receivedByName?: string;
  receivedByDocument?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  code: string; // route code
  name: string;
  driverId?: string;
  vehicleId?: string;
  deliveryIds: string[]; // Ordered list of deliveries
  status: RouteStatus;
  plannedStartAt?: string;
  actualStartAt?: string;
  actualEndAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationUpdate {
  id: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  routeId: string;
  deliveryId?: string;
  driverId: string;
  vehicleId: string;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  location?: Coordinates;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: string; // JSON-string of state before
  after?: string;  // JSON-string of state after
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  defaultMapCenter: Coordinates;
  locationUpdateIntervalSeconds: number;
  allowedRoles: UserRole[];
  updatedAt: string;
}

export interface RoleModulePermission {
  moduleId: string;
  moduleLabel: string;
  enabled: boolean;
  accessType: "read" | "edit"; // "read" = Lectura, "edit" = Edición
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: RoleModulePermission[];
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

